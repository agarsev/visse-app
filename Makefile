SRC:=frontend
ASSET_DIR:=$(SRC)/assets
OUT_DIR:=dist
OUT:=$(OUT_DIR)
OUT_ASSETS=$(OUT)/assets

ESB_OPTS:=--bundle --format=esm --target=es2018
JSX_OPTS:=--inject:$(SRC)/preact-shim.js --jsx-factory=h --jsx-fragment=Fragment 
ENV:=
TW_OPTS:=

PROD?=0
ifeq ($(PROD), 1)
OUT:=$(OUT)/production
ENV+=NODE_ENV=production
TW_OPTS+=--minify
ESB_OPTS+=--minify --define:process.env.NODE_ENV=\"production\"
else
OUT:=$(OUT)/dev
ESB_OPTS+=--define:process.env.NODE_ENV=\"development\"
endif

TARGETS:=$(addprefix $(OUT)/, index.html index.js hand.js style.css manifest.json)

ASSET_SOURCES:=$(foreach EXT, png svg glb, $(wildcard $(ASSET_DIR)/*.$(EXT)))
ASSETS:=$(patsubst $(ASSET_DIR)/%, $(OUT_ASSETS)/%, $(ASSET_SOURCES))

ALL:=$(TARGETS) $(ASSETS)

all: $(ALL)

$(OUT)/index.html: $(SRC)/index.html | $(OUT)
	cp $< $@

$(OUT)/index.js: $(SRC)/index.jsx $(wildcard $(SRC)/*.jsx) | $(OUT)
	$(ENV) esbuild $< $(ESB_OPTS) $(JSX_OPTS) --outfile=$@

$(OUT)/hand.js: $(SRC)/hand.js | $(OUT)
	$(ENV) esbuild $< $(ESB_OPTS) --outfile=$@

$(OUT)/style.css: $(SRC)/style.css $(SRC)/tailwind.config.cjs | $(OUT)
	$(ENV) tailwindcss -i $< -c $(SRC)/tailwind.config.cjs -o $@ $(TW_OPTS)

$(OUT)/manifest.json: $(SRC)/manifest.json | $(OUT)
	cp $< $@

$(OUT_ASSETS)/%: $(ASSET_DIR)/% | $(OUT_ASSETS)
	cp $< $@

$(OUT) $(OUT_ASSETS):
	mkdir -p $@

clean:
	rm -rf $(OUT_DIR)

serve: $(ALL)
	@live-server --cors --no-css-inject --wait=200 $(OUT) &
	poetry run uvicorn backend.main:app --reload &
	wait

build:
	make PROD=1 clean all
	poetry build -f wheel
	npm pack --pack-destination dist


.ONESHELL:

.PHONY: clean serve build
