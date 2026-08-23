import app from '../hono/hono';
import emailService from '../service/email-service';
import result from '../model/result';
import orm from '../entity/orm';
import email from '../entity/email';
import user from '../entity/user';
import { and, asc, count, desc, eq, gt, lt, ne } from 'drizzle-orm';
import { emailConst } from '../const/entity-const';

app.get('/allEmail/list', async (c) => {
	try {
		const data = await emailService.allList(c, c.req.query());
		return c.json(result.ok(data));
	} catch (err) {
		// Keep the admin mailbox list usable when the full query fails.
		// The normal path remains unchanged; this fallback deliberately avoids
		// COLLATE/search expressions and attachment expansion.
		console.error('allEmail/list failed, using fallback:', err);

		const params = c.req.query();
		let size = Number(params.size);
		if (!Number.isFinite(size) || size <= 0) size = 50;
		if (size > 50) size = 50;

		let emailId = Number(params.emailId);
		const timeSort = Number(params.timeSort) === 1;
		if (!Number.isFinite(emailId) || emailId <= 0) {
			emailId = timeSort ? 0 : 9999999999;
		}

		const conditions = [ne(email.status, emailConst.status.SAVING)];
		if (params.type === 'send') conditions.push(eq(email.type, emailConst.type.SEND));
		if (params.type === 'receive') conditions.push(eq(email.type, emailConst.type.RECEIVE));
		if (params.type === 'delete') {
			const { isDel } = await import('../const/entity-const');
			conditions.push(eq(email.isDel, isDel.DELETE));
		}
		if (params.type === 'noone') conditions.push(eq(email.status, emailConst.status.NOONE));

		conditions.push(timeSort ? gt(email.emailId, emailId) : lt(email.emailId, emailId));

		const query = orm(c).select({
			...email,
			userEmail: user.email
		}).from(email).leftJoin(user, eq(email.userId, user.userId)).where(and(...conditions));

		query.orderBy(timeSort ? asc(email.emailId) : desc(email.emailId));

		const list = await query.limit(size).all();
		const totalRow = await orm(c).select({ total: count() })
			.from(email)
			.where(and(...conditions.filter((_, index) => index < conditions.length - 1)))
			.get();

		return c.json(result.ok({
			list,
			total: totalRow.total,
			latestEmail: {
				emailId: list.length ? list[0].emailId : 0,
				accountId: list.length ? list[0].accountId : 0,
				userId: list.length ? list[0].userId : 0
			}
		}));
	}
})

app.delete('/allEmail/delete', async (c) => {
	const list = await emailService.physicsDelete(c, c.req.query());
	return c.json(result.ok(list));
})

app.delete('/allEmail/batchDelete', async (c) => {
	await emailService.batchDelete(c, c.req.query());
	return c.json(result.ok());
})

app.get('/allEmail/latest', async (c) => {
	const list = await emailService.allEmailLatest(c, c.req.query());
	return c.json(result.ok(list));
})
