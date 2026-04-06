# Dockerized OpenCode Testing Plan (Implemented)

## Objective

Provide a dedicated Docker environment for testing the Conductor OpenCode plugin with isolated config/state and mounted workspace source.

## Implemented Components

- `docker/Dockerfile`
  - Base: `oven/bun:1`
  - Installs common tooling (`bash`, `git`, `curl`, `ripgrep`, `python3`, `jq`)
  - Installs OpenCode CLI globally (`bun install -g opencode-ai`)
  - Uses non-root `dev` user
  - Entrypoint: `conductor-entrypoint`

- `docker/entrypoint.sh`
  - Creates OpenCode config/cache dirs
  - Seeds config from `docker/opencode.json` on first run
  - Optional forced sync with `CONDUCTOR_FORCE_CONFIG_SYNC=1`

- `docker/opencode.json`
  - Minimal config schema
  - Plugin entry points to local mounted build artifact:
    - `file:///workspace/dist/index.js`

- `docker-compose.yml`
  - Service: `opencode-plugin-dev`
  - Interactive mode enabled (`stdin_open`, `tty`)
  - Mounts repository to `/workspace`
  - Uses named volumes for OpenCode config/cache and Bun caches
  - Uses `/root` home paths to avoid volume ownership conflicts
  - Forwards common model provider env vars

- `docker/README.md`
  - Usage commands
  - Config sync behavior
  - API key notes
  - Codanna diagnostics expectation

## Expected Workflow

1. Build your plugin (`dist/index.js`) on host.
2. Build Docker image.
3. Run OpenCode in container interactively.
4. Validate plugin behavior and persistence on mounted project.

## Validation Status

- Docker Compose configuration validation: passed
- Docker image build: blocked in this environment due to Docker daemon permission

## Manual Verification Commands

```bash
docker compose -f docker-compose.yml config
docker compose -f docker-compose.yml build opencode-plugin-dev
docker compose -f docker-compose.yml run --rm opencode-plugin-dev
```

## Notes

- Codanna is intentionally not preinstalled in image so diagnostics paths can be tested.
- If needed later, Codanna can be added as an optional build stage/variant.
