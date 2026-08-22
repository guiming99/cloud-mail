import app from '../hono/hono';
import result from '../model/result';
import conversationService from '../service/conversation-service';
import userContext from '../security/user-context';

app.get('/conversation/list', async (c) => {
  const data = await conversationService.list(c, userContext.getUserId(c), c.req.query('accountId'));
  return c.json(result.ok(data));
});

app.get('/conversation/detail', async (c) => {
  const data = await conversationService.detail(c, userContext.getUserId(c), c.req.query('accountId'), c.req.query('threadId'));
  return c.json(result.ok(data));
});
