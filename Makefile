OUT:=dist
SRC:=src

ESBUILD_OPTS:=--inject:$(SRC)/preact-shim.js --jsx-factory=h --jsx-fragment=Fragment 
ENV:=
TW_OPTS:=

PROD:=0
ifeq ($(PROD), 1)
ENV+=NODE_ENV=production
TW_OPTS+=--minify
endif

TARGETS:=$(addprefix $(OUT)/, index.html index.js style.css)

all: $(TARGETS)

$(OUT)/index.html: $(SRC)/index.html | $(OUT)
	cp $< $@

$(OUT)/index.js: $(SRC)/index.jsx $(wildcard $(SRC)/*.jsx) | $(OUT)
	$(ENV) esbuild $< --bundle $(ESBUILD_OPTS) --outfile=$@

$(OUT)/style.css: $(SRC)/style.css $(wildcard $(SRC)/*.css) | $(OUT)
	$(ENV) tailwindcss -i $< -o $@ $(TW_OPTS)

$(OUT):
	mkdir -p $@

clean:
	rm -rf $(OUT)

serve:
	@live-server --cors --no-css-inject --wait=200 $(OUT) &
	cd ../backend ; poetry run uvicorn main:app --reload &
	wait


.ONESHELL:

.PHONY: clean serve
