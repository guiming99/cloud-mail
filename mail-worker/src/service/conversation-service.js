import orm from '../entity/orm';
import email from '../entity/email';
import attService from './att-service';
import { and, desc, eq, ne, or } from 'drizzle-orm';
import { emailConst, isDel } from '../const/entity-const';

function normalizeSubject(subject = '') {
  return String(subject)
    .replace(/^\s*((re|fw|fwd|回复|转发)\s*[:：]\s*)+/ig, '')
    .trim()
    .toLowerCase();
}

function parseList(value) {
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

function participants(row) {
  const list = row.type === emailConst.type.SEND
    ? parseList(row.recipient)
    : [{ address: row.sendEmail }];
  return [...new Set(list.map(x => String(x.address || '').trim().toLowerCase()).filter(Boolean))].sort();
}

function fallbackKey(row) {
  return `fallback:${normalizeSubject(row.subject)}|${participants(row).join(',')}`;
}

function buildGroups(rows) {
  const byMessageId = new Map();
  rows.forEach(row => { if (row.messageId) byMessageId.set(row.messageId, row); });

  const rootCache = new Map();
  function rootOf(row) {
    if (rootCache.has(row.emailId)) return rootCache.get(row.emailId);
    let current = row;
    const seen = new Set();
    while (current && current.inReplyTo && byMessageId.has(current.inReplyTo) && !seen.has(current.emailId)) {
      seen.add(current.emailId);
      current = byMessageId.get(current.inReplyTo);
    }
    const root = current || row;
    const key = root.messageId ? `message:${root.messageId}` : fallbackKey(root);
    rootCache.set(row.emailId, key);
    return key;
  }

  const groups = new Map();
  rows.forEach(row => {
    const key = rootOf(row);
    if (!groups.has(key)) groups.set(key, { key, rows: [] });
    groups.get(key).rows.push(row);
  });

  // Historical sent messages may have no Message-ID. Merge those using the
  // normalized subject + participants fallback key.
  const merged = new Map();
  for (const group of groups.values()) {
    const first = group.rows[0];
    const key = group.key.startsWith('fallback:') ? group.key : group.key;
    if (group.key.startsWith('fallback:')) {
      const old = merged.get(key);
      if (old) old.rows.push(...group.rows);
      else merged.set(key, group);
    } else {
      merged.set(key, group);
    }
  }

  return [...merged.values()].map(group => {
    group.rows.sort((a, b) => a.emailId - b.emailId);
    const latest = group.rows[group.rows.length - 1];
    const root = group.rows[0];
    return {
      threadId: String(root.emailId),
      subject: latest.subject || root.subject || '',
      count: group.rows.length,
      unreadCount: group.rows.filter(x => x.unread === 0 && x.type === emailConst.type.RECEIVE).length,
      latestTime: latest.createTime,
      latestSender: latest.name || latest.sendEmail,
      latestEmail: latest,
      messages: group.rows
    };
  }).sort((a, b) => b.latestEmail.emailId - a.latestEmail.emailId);
}

const conversationService = {
  async loadRows(c, userId, accountId) {
    const rows = await orm(c).select().from(email)
      .where(and(
        eq(email.userId, userId),
        eq(email.accountId, Number(accountId)),
        eq(email.isDel, isDel.NORMAL),
        ne(email.status, emailConst.status.SAVING),
        or(eq(email.type, emailConst.type.SEND), eq(email.type, emailConst.type.RECEIVE))
      ))
      .orderBy(desc(email.emailId))
      .limit(1500)
      .all();

    const attList = await attService.selectByEmailIds(c, rows.map(row => row.emailId));
    rows.forEach(row => {
      row.attList = attList.filter(att => att.emailId === row.emailId);
    });
    return rows;
  },

  async list(c, userId, accountId) {
    const rows = await this.loadRows(c, userId, accountId);
    const groups = buildGroups(rows);
    return { list: groups, total: groups.length };
  },

  async detail(c, userId, accountId, threadId) {
    const rows = await this.loadRows(c, userId, accountId);
    return buildGroups(rows).find(group => group.threadId === String(threadId)) || null;
  }
};

export default conversationService;
