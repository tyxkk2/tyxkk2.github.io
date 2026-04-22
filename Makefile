.PHONY: dev build

dev:
	hugo server -D --disableFastRender

build:
	hugo --gc --minify
