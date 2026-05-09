.PHONY: dev build build-local

LOCAL_BASE_URL ?= http://localhost:1313/

dev:
	hugo server -D --disableFastRender --renderToMemory --config hugo.toml,hugo.local.toml --baseURL $(LOCAL_BASE_URL)

build-local:
	hugo --gc --config hugo.toml,hugo.local.toml --baseURL $(LOCAL_BASE_URL)

build:
	hugo --gc --minify
