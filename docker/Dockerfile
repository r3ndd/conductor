FROM oven/bun:1

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    jq \
    nodejs \
    npm \
    python3 \
    ripgrep \
    vim \
  && rm -rf /var/lib/apt/lists/*

RUN bun install -g opencode-ai

COPY docker/entrypoint.sh /usr/local/bin/conductor-entrypoint
RUN chmod +x /usr/local/bin/conductor-entrypoint

ENV HOME=/root
ENV PATH=/root/.bun/bin:${PATH}

WORKDIR /workspace

ENTRYPOINT ["/usr/local/bin/conductor-entrypoint"]
CMD ["opencode"]
