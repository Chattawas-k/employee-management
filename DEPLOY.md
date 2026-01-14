## Deploy (Docker + HTTPS) for `jg.xalpha.co.th`

This repo contains:
- **Frontend**: Angular (served as static files via Nginx)
- **Backend**: ASP.NET Core WebAPI
- **DB**: PostgreSQL
- **Reverse proxy + HTTPS**: Caddy (Let’s Encrypt)

### Target URLs
- **Web**: `https://jg.xalpha.co.th/`
- **API**: `https://jg.xalpha.co.th/api/v1/...`
- **Health**: `https://jg.xalpha.co.th/health`
- **SignalR**: `https://jg.xalpha.co.th/hubs/notification`

---

## 1) Prerequisites on the Linux server
- Docker installed and running
- Docker Compose plugin available (`docker compose version`)
- Ports **80** and **443** open from the internet to the server
- DNS record already points to this server (see next section)

---

## 2) DNS setup
Create DNS records:
- `A` record: `jg.xalpha.co.th` → **your server public IPv4**

Wait until DNS propagates before starting Caddy (otherwise Let’s Encrypt issuance may fail).

---

## 3) Get the source code onto the server
Example:

```bash
git clone <your-repo-url> employee-management
cd employee-management
```

---

## 4) Create `.env` for production
This repo ships an example file: `env.example`

Copy it to `.env` and edit values:

```bash
cp env.example .env
nano .env
```

Important settings:
- **POSTGRES_PASSWORD**: set a strong password
- **JWT_KEY**: set a long random string (do not use the default)

---

## 5) Start the stack (build + run)
From repo root:

```bash
docker compose up -d --build
```

Check status:

```bash
docker compose ps
```

Follow logs (helpful if HTTPS isn’t ready yet):

```bash
docker logs -f employee_management_caddy
```

---

## 6) Verify the deployment
### Web
Open in browser:
- `https://jg.xalpha.co.th`

### API / Health
```bash
curl -k https://jg.xalpha.co.th/health
```

If the API is reachable, you should get a 200 response (or JSON depending on middleware).

### Notes about database migration/seed
On startup, the backend attempts to:
- connect to PostgreSQL
- apply EF Core migrations (if any)
- seed default data

---

## 7) Common operations
Restart all services:

```bash
docker compose restart
```

Stop everything:

```bash
docker compose down
```

Stop everything but keep volumes (database data stays):

```bash
docker compose down
```

Stop everything and delete database data (DANGEROUS):

```bash
docker compose down -v
```

---

## 8) Backup / Restore PostgreSQL
### Backup
```bash
docker exec -t employee_management_postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
```

### Restore
```bash
cat backup.sql | docker exec -i employee_management_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

---

## 9) Files involved
- `docker-compose.yml`: service definitions
- `deploy/caddy/Caddyfile`: HTTPS + routing
- `deploy/nginx/default.conf`: SPA routing for Angular
- `Backend/employee_management.WebAPI/Dockerfile`: backend image
- `Fontend/Dockerfile`: frontend image

