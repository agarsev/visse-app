OUT:=dist
SRC:=frontend

ESBUILD_OPTS:=--inject:$(SRC)/preact-shim.js --jsx-factory=h --jsx-fragment=Fragment 
ENV:=
TW_OPTS:=

PROD:=0
ifeq ($(PROD), 1)
ENV+=NODE_ENV=production
TW_OPTS+=--minify
endif

TARGETS:=$(addprefix $(OUT)/, index.html index.js style.css)
IMAGES:=$(patsubst $(SRC)/img/%, $(OUT)/img/%, $(wildcard $(SRC)/img/*))

all: $(TARGETS) $(IMAGES)

$(OUT)/index.html: $(SRC)/index.html | $(OUT)
	cp $< $@

$(OUT)/img/%: $(SRC)/img/% | $(OUT)/img
	cp $< $@

$(OUT)/index.js: $(SRC)/index.jsx $(wildcard $(SRC)/*.jsx) | $(OUT)
	$(ENV) esbuild $< --bundle $(ESBUILD_OPTS) --outfile=$@

$(OUT)/style.css: $(SRC)/style.css $(SRC)/tailwind.config.cjs | $(OUT)
	$(ENV) tailwindcss -i $< -c $(SRC)/tailwind.config.cjs -o $@ $(TW_OPTS)

$(OUT) $(OUT)/img:
	mkdir -p $@

clean:
	rm -rf $(OUT)

serve:
	@live-server --cors --no-css-inject --wait=200 $(OUT) &
	poetry run uvicorn backend.main:app --reload &
	wait


.ONESHELL:

.PHONY: clean serve
