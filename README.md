### API Documentation (Swagger)

After starting the server, open:

- `http://localhost:3000/api/docs` for Swagger UI
- `http://localhost:3000/api/docs.json` for the raw OpenAPI spec

### MongoDB

Notifications are stored in MongoDB. The backend uses this local default unless
you override it in `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/smart-library
MONGODB_DB_NAME=smart-library
```

Install and run MongoDB locally, or start a MongoDB container, before using the
`/api/notifications` endpoints.
