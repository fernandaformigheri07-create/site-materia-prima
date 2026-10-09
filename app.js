"use strict";

const STORAGE_KEY = "materia-prima-demo-cart";
const MAX_QUANTITY = 99;
const HERO_PRODUCT_ID = 1987; // foto oficial do pote usada na imagem da home
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const state = {
  groups: [],
  products: new Map(),
  activeGroup: "todos",
  query: "",
  sort: "default",
};
const cart = new Map();
let detail = null;

const $ = (selector, root = document) => root.querySelector(selector);
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

/* ---------- Text helpers ---------- */

function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const KEEP_UPPER = new Set(["MP", "ISO", "GH", "ZMA", "BCAA", "XT", "PW", "DC", "IFOS", "TDZ"]);
const KEEP_LOWER = new Set(["de", "da", "do", "das", "dos", "e", "com", "sem"]);

function tidyCase(name) {
  const letters = name.replace(/[^A-Za-zÀ-ÿ]/g, "");
  const upper = letters.replace(/[^A-ZÀ-Þ]/g, "");
  if (!letters || upper.length / letters.length < 0.8) return name;
  return name
    .split(" ")
    .map((word, index) => {
      const bare = word.replace(/[^A-Za-zÀ-ÿ0-9-]/g, "");
      if (KEEP_UPPER.has(bare)) return word;
      if (/\d/.test(word)) return word.toLowerCase();
      const lower = word.toLocaleLowerCase("pt-BR");
      if (index > 0 && KEEP_LOWER.has(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
    })
    .join(" ");
}

/** Apenas formatação de exibição: o nome original continua em catalogo.json. */
function displayName(raw) {
  let name = String(raw ?? "").replace(/\s+/g, " ").trim();
  name = name.replace(/\s*\(\s*1\s*\)$/, "");
  name = name.replace(/\s*\(\s*([^)]*?)\s*\)/g, " ($1)");
  name = name.replace(/\s+-\s*$/, "");
  name = tidyCase(name);
  name = name.replace(/\((\d+(?:[.,]\d+)?)\s*(g|kg|ml|caps?|cap\.?|softgel|litros?)\)/gi, (_, n, unit) => `(${n}${/^(g|kg|ml)$/i.test(unit) ? "" : " "}${unit.toLowerCase()})`);
  return name.replace(/\s{2,}/g, " ").trim();
}

function sentence(text) {
  const value = String(text ?? "").replace(/\s+/g, " ").trim();
  return value ? value.charAt(0).toLocaleUpperCase("pt-BR") + value.slice(1) : "";
}

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

/* ---------- Product model ---------- */

function optionKind(label) {
  const value = normalize(label);
  if (value.includes("sabor")) return { one: "sabor", many: "sabores", legend: value.includes("whey") ? "Sabor do whey" : "Sabor" };
  if (value.includes("cor")) return { one: "cor", many: "cores", legend: "Cor" };
  return { one: "opção", many: "opções", legend: "Opção" };
}

function buildOptionGroups(rawGroups) {
  return (rawGroups ?? [])
    .map((group) => {
      const options = (group.options ?? []).filter((option) => option.isActive !== false);
      const multiple = Boolean(group.multiple);
      const required = Boolean(group.required) || Number(group.minimum) > 0;
      const min = required ? Math.max(1, Number(group.minimum) || 1) : 0;
      const max = multiple ? Math.max(min, Math.min(Number(group.maximum) || options.length, options.length)) : 1;
      return { id: Number(group.id), kind: optionKind(group.label), multiple, required, min: Math.min(min, max), max, options };
    })
    .filter((group) => group.options.length > 0);
}

function needsChoice(product) {
  return product.optionGroups.some((group) => group.required && group.options.length > 1);
}

/** Opções obrigatórias com uma única escolha possível são marcadas automaticamente. */
function defaultSelection(product) {
  return product.optionGroups.map((group) => new Set(group.required && group.options.length === 1 ? [Number(group.options[0].id)] : []));
}

function selectionIsValid(product, selection) {
  return product.optionGroups.every((group, index) => {
    const count = selection[index]?.size ?? 0;
    return count >= group.min && count <= group.max;
  });
}

function priceFor(product, optionIds) {
  const chosen = new Set(optionIds.map(Number));
  return product.optionGroups
    .flatMap((group) => group.options)
    .reduce((sum, option) => sum + (chosen.has(Number(option.id)) ? Number(option.price) || 0 : 0), product.price);
}

function optionSummary(product, optionIds) {
  const chosen = new Set(optionIds.map(Number));
  return product.optionGroups
    .map((group) => {
      const names = group.options.filter((option) => chosen.has(Number(option.id))).map((option) => option.label);
      if (names.length) return `${sentence(group.kind.legend)}: ${names.join(", ")}`;
      return `${sentence(group.kind.legend)}: sem preferência`;
    })
    .join(" · ");
}

function makeProduct(raw, group, index, displayNames = {}) {
  const isCombo = group.id === "combos";
  const description = sentence(raw.description);
  const includes = isCombo ? description.split("+").map(sentence).filter(Boolean) : [];
  const optionGroups = buildOptionGroups(raw.options);
  const images = (raw.images?.length ? raw.images : [raw.image]).filter(Boolean);
  const product = {
    id: Number(raw.id),
    name: displayNames[raw.id] || displayName(raw.name),
    description,
    includes,
    isCombo,
    groupId: group.id,
    groupName: group.name,
    price: Number(raw.price),
    image: images[0] || "",
    images,
    optionGroups,
    index,
  };
  const optionText = optionGroups.flatMap((g) => g.options.map((o) => o.label)).join(" ");
  product.search = normalize(`${product.name} ${raw.name} ${description} ${group.name} ${optionText}`);
  return product;
}

/* ---------- Catalog rendering ---------- */

function thumbFor(src) {
  return src.replace("assets/catalog/", "assets/catalog/thumbs/");
}

function cardImage(product, size) {
  const wrap = el("div", "card__media");
  if (!product.image) {
    wrap.append(el("span", "card__placeholder", "Foto indisponível"));
    return wrap;
  }
  const image = new Image(size, size);
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  // Miniatura leve (scripts/gerar-miniaturas.py); se faltar, usa a foto original e, por fim, o aviso.
  image.addEventListener("error", function fallback() {
    if (image.dataset.fallback !== "1") {
      image.dataset.fallback = "1";
      image.src = product.image;
      return;
    }
    image.removeEventListener("error", fallback);
    image.replaceWith(el("span", "card__placeholder", "Foto indisponível"));
  });
  image.src = thumbFor(product.image);
  wrap.append(image);
  return wrap;
}

function createCard(product) {
  const card = el("article", "card");
  card.dataset.id = String(product.id);

  const media = cardImage(product, 112);
  media.addEventListener("click", () => openProduct(product));

  const body = el("div", "card__body");
  const title = el("h4", "card__title");
  const titleButton = el("button", "", product.name);
  titleButton.type = "button";
  titleButton.addEventListener("click", () => openProduct(product));
  title.append(titleButton);
  body.append(title);

  if (product.isCombo && product.includes.length) {
    const list = el("ul", "card__includes");
    list.setAttribute("aria-label", "Inclui");
    product.includes.forEach((item) => list.append(el("li", "", item)));
    body.append(list);
  } else if (product.description) {
    body.append(el("p", "card__meta", product.description));
  }

  const firstGroup = product.optionGroups[0];
  if (firstGroup) {
    const kind = firstGroup.kind;
    const text = firstGroup.options.length === 1 ? `${sentence(kind.one)}: ${firstGroup.options[0].label}` : `${plural(firstGroup.options.length, kind.one, kind.many)}${firstGroup.required ? "" : ", escolha opcional"}`;
    body.append(el("p", "card__meta", text));
  }

  const foot = el("div", "card__foot");
  const price = el("span", "card__price", money.format(product.price));
  const add = el("button", "card__add");
  add.type = "button";
  if (needsChoice(product)) {
    const kind = product.optionGroups.find((group) => group.required && group.options.length > 1).kind;
    add.textContent = kind.one === "opção" ? "Escolher opção" : `Escolher ${kind.one}`;
    add.setAttribute("aria-label", `${add.textContent} de ${product.name}`);
    add.addEventListener("click", () => openProduct(product));
  } else {
    add.textContent = "Adicionar";
    add.setAttribute("aria-label", `Adicionar ${product.name} à sacola`);
    add.addEventListener("click", () => {
      const optionIds = defaultSelection(product).flatMap((set) => [...set]);
      const source = card.querySelector(".card__media img") || card.querySelector(".card__media");
      const added = addToCart(product, optionIds);
      if (added) celebrateAdd(product, source.getBoundingClientRect());
    });
  }
  foot.append(price, add);
  card.append(media, body, foot);
  product.card = card;
  return card;
}

function buildCatalog() {
  const container = $("#catalog-sections");
  const sections = state.groups.map((group) => {
    const section = el("section", "group");
    section.id = `grupo-${group.id}`;
    section.setAttribute("aria-labelledby", `grupo-${group.id}-titulo`);
    const head = el("div", "group__head");
    const title = el("h3", "", group.title);
    title.id = `grupo-${group.id}-titulo`;
    const count = el("span", "group__count");
    head.append(title, count);
    if (group.intro) head.append(el("p", "group__intro", group.intro));
    const grid = el("div", "product-grid");
    group.products.forEach((product) => grid.append(createCard(product)));
    section.append(head, grid);
    Object.assign(group, { section, countEl: count, grid });
    return section;
  });
  container.replaceChildren(...sections);
}

function buildCategoryChips() {
  const list = $("#category-list");
  const entries = [{ id: "todos", name: "Todos" }, ...state.groups];
  list.replaceChildren(
    ...entries.map((group) => {
      const chip = el("button", "chip");
      chip.type = "button";
      chip.dataset.group = group.id;
      chip.setAttribute("aria-pressed", String(group.id === state.activeGroup));
      chip.append(el("span", "", group.name), el("span", "chip__count"));
      return chip;
    }),
  );
  list.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-group]");
    if (!chip) return;
    setGroup(chip.dataset.group, { scroll: true });
  });
  list.addEventListener("scroll", updateChipFade, { passive: true });
  window.addEventListener("resize", updateChipFade, { passive: true });
  updateChipFade();
}

function updateChipFade() {
  const list = $("#category-list");
  list.parentElement.classList.toggle("has-more", list.scrollLeft + list.clientWidth < list.scrollWidth - 4);
}

const sorters = {
  default: (a, b) => a.index - b.index,
  "price-low": (a, b) => a.price - b.price || a.name.localeCompare(b.name, "pt-BR"),
  "price-high": (a, b) => b.price - a.price || a.name.localeCompare(b.name, "pt-BR"),
  name: (a, b) => a.name.localeCompare(b.name, "pt-BR"),
};

function matches(product, tokens) {
  return tokens.every((token) => product.search.includes(token));
}

function applyFilters() {
  const tokens = normalize(state.query).split(/\s+/).filter(Boolean);
  const sorter = sorters[state.sort] ?? sorters.default;
  let visibleTotal = 0;
  let matchTotal = 0;
  const chipCounts = new Map();

  state.groups.forEach((group) => {
    const matching = group.products.filter((product) => matches(product, tokens)).sort(sorter);
    const matchingIds = new Set(matching.map((product) => product.id));
    const groupVisible = state.activeGroup === "todos" || state.activeGroup === group.id;
    chipCounts.set(group.id, matching.length);
    matchTotal += matching.length;

    const ordered = [...matching, ...group.products.filter((product) => !matchingIds.has(product.id))];
    ordered.forEach((product) => {
      product.card.hidden = !(groupVisible && matchingIds.has(product.id));
    });
    group.grid.append(...ordered.map((product) => product.card));

    group.section.hidden = !groupVisible || matching.length === 0;
    group.countEl.textContent = tokens.length ? `${matching.length} de ${plural(group.products.length, "produto", "produtos")}` : plural(group.products.length, "produto", "produtos");
    if (groupVisible) visibleTotal += matching.length;
  });

  chipCounts.set("todos", matchTotal);
  document.querySelectorAll("#category-list [data-group]").forEach((chip) => {
    chip.querySelector(".chip__count").textContent = String(chipCounts.get(chip.dataset.group) ?? 0);
    chip.setAttribute("aria-pressed", String(chip.dataset.group === state.activeGroup));
  });

  const total = state.groups.reduce((sum, group) => sum + group.products.length, 0);
  const filtering = tokens.length > 0 || state.activeGroup !== "todos";
  $("#catalog-status").textContent = filtering
    ? `${plural(visibleTotal, "produto encontrado", "produtos encontrados")}`
    : `${plural(total, "produto", "produtos")} em ${state.groups.length} categorias`;

  const summary = $("#filter-summary");
  summary.hidden = !filtering || visibleTotal === 0;
  if (filtering) {
    const group = state.groups.find((entry) => entry.id === state.activeGroup);
    const parts = [`Mostrando ${plural(visibleTotal, "produto", "produtos")}`];
    if (group) parts.push(`em ${group.name}`);
    if (tokens.length) parts.push(`para “${state.query.trim()}”`);
    $("#filter-summary-text").textContent = parts.join(" ");
  }

  const empty = $("#empty-state");
  empty.hidden = visibleTotal > 0;
  if (visibleTotal === 0) {
    const group = state.groups.find((entry) => entry.id === state.activeGroup);
    const elsewhere = group && matchTotal > 0 ? ` Há ${plural(matchTotal, "resultado", "resultados")} em outras categorias.` : "";
    $("#empty-state-text").textContent = tokens.length
      ? `Nada encontrado para “${state.query.trim()}”${group ? ` em ${group.name}` : ""}.${elsewhere} Confira a grafia ou procure por outra marca ou sabor.`
      : "Nenhum produto nesta categoria.";
  }
}

function setGroup(groupId, { scroll = false } = {}) {
  state.activeGroup = state.groups.some((group) => group.id === groupId) ? groupId : "todos";
  applyFilters();
  const chip = document.querySelector(`#category-list [data-group="${state.activeGroup}"]`);
  chip?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduceMotion.matches ? "auto" : "smooth" });
  if (scroll) {
    const target = $("#catalog-sections");
    const bar = $(".category-bar").getBoundingClientRect();
    if (target.getBoundingClientRect().top < bar.bottom) {
      target.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
    }
  }
}

function clearFilters() {
  state.query = "";
  state.activeGroup = "todos";
  $("#product-search").value = "";
  applyFilters();
}

/* ---------- Product dialog ---------- */

const productDialog = $("#product-dialog");

function openProduct(product) {
  detail = { product, photo: 0, selection: defaultSelection(product) };
  $("#detail-group").textContent = product.groupName;
  $("#detail-title").textContent = product.name;
  $("#detail-description").textContent = product.isCombo ? "" : product.description;

  const includes = $("#detail-includes");
  includes.replaceChildren();
  if (product.isCombo && product.includes.length) {
    const box = el("div", "includes");
    const list = el("ul");
    product.includes.forEach((item) => list.append(el("li", "", item)));
    box.append(el("h3", "", "O que vem no combo"), list);
    includes.append(box);
  }

  renderOptionGroups();
  renderGallery();
  updateDetailState();
  openDialog(productDialog);
}

function renderGallery() {
  const { product, photo } = detail;
  const image = $("#detail-image");
  const fallback = $("#detail-image-fallback");
  const src = product.images[photo];
  image.hidden = !src;
  fallback.hidden = Boolean(src);
  if (src) {
    image.onerror = () => { image.hidden = true; fallback.hidden = false; };
    image.src = src;
    image.alt = product.images.length > 1 ? `${product.name}, foto ${photo + 1} de ${product.images.length}` : product.name;
  }
  $("#gallery-controls").hidden = product.images.length < 2;
  $("#gallery-position").textContent = `${photo + 1} de ${product.images.length}`;
}

function stepPhoto(delta) {
  if (!detail) return;
  const total = detail.product.images.length;
  detail.photo = (detail.photo + delta + total) % total;
  renderGallery();
}

function renderOptionGroups() {
  const { product, selection } = detail;
  const container = $("#detail-options");
  container.replaceChildren(
    ...product.optionGroups.map((group, groupIndex) => {
      const fieldset = el("fieldset", "option-group");
      fieldset.dataset.groupIndex = String(groupIndex);
      const legend = el("legend", "", group.kind.legend);
      let hintText;
      if (group.multiple) hintText = group.min === group.max ? `Escolha ${plural(group.max, group.kind.one, group.kind.many)}` : `Escolha de ${group.min} a ${plural(group.max, group.kind.one, group.kind.many)}`;
      else hintText = group.required ? `Escolha 1 ${group.kind.one}` : "Opcional";
      if (group.multiple && !group.required) hintText = `Opcional, até ${plural(group.max, group.kind.one, group.kind.many)}`;
      const hint = el("span", "option-group__hint", hintText);
      hint.id = `option-hint-${groupIndex}`;
      fieldset.setAttribute("aria-describedby", hint.id);
      const choices = el("div", "option-group__choices");

      const entries = [...group.options];
      if (!group.required && !group.multiple) entries.unshift({ id: "none", label: "Sem preferência" });
      entries.forEach((option) => {
        const label = el("label", "option-choice");
        const input = document.createElement("input");
        input.type = group.multiple ? "checkbox" : "radio";
        input.name = `option-${product.id}-${groupIndex}`;
        input.value = String(option.id);
        input.checked = option.id === "none" ? selection[groupIndex].size === 0 : selection[groupIndex].has(Number(option.id));
        input.addEventListener("change", () => {
          const set = selection[groupIndex];
          if (group.multiple) {
            if (input.checked) set.add(Number(option.id));
            else set.delete(Number(option.id));
          } else {
            set.clear();
            if (option.id !== "none") set.add(Number(option.id));
          }
          updateDetailState();
        });
        label.append(input, el("span", "", option.label));
        choices.append(label);
      });
      fieldset.append(legend, hint, choices);
      return fieldset;
    }),
  );
}

function missingGroupIndex() {
  const { product, selection } = detail;
  return product.optionGroups.findIndex((group, index) => (selection[index]?.size ?? 0) < group.min);
}

function updateDetailState() {
  if (!detail) return;
  const { product, selection } = detail;
  // Limita checkboxes ao máximo permitido sem desmarcar escolhas do usuário.
  product.optionGroups.forEach((group, index) => {
    if (!group.multiple) return;
    const full = selection[index].size >= group.max;
    document.querySelectorAll(`#detail-options [data-group-index="${index}"] input`).forEach((input) => {
      input.disabled = full && !input.checked;
    });
  });
  const optionIds = selection.flatMap((set) => [...set]);
  $("#detail-price").textContent = money.format(priceFor(product, optionIds));
  const missing = missingGroupIndex();
  const hint = $("#detail-hint");
  if (missing >= 0) {
    const group = product.optionGroups[missing];
    hint.textContent = group.min > 1 ? `Escolha pelo menos ${plural(group.min, group.kind.one, group.kind.many)} para adicionar.` : `Escolha 1 ${group.kind.one} para adicionar.`;
    hint.hidden = false;
  } else {
    hint.hidden = true;
  }
  if (missing >= 0) $("#detail-add").setAttribute("aria-describedby", "detail-hint");
  else $("#detail-add").removeAttribute("aria-describedby");
}

function addFromDetail() {
  if (!detail) return;
  const { product, selection } = detail;
  const missing = missingGroupIndex();
  if (missing >= 0) {
    updateDetailState();
    document.querySelector(`#detail-options [data-group-index="${missing}"] input:not(:disabled)`)?.focus();
    return;
  }
  const source = $("#detail-image");
  const rect = source.hidden ? $(".gallery__frame").getBoundingClientRect() : source.getBoundingClientRect();
  const added = addToCart(product, selection.flatMap((set) => [...set]));
  if (!added) return;
  productDialog.close();
  celebrateAdd(product, rect);
}

/* ---------- Cart ---------- */

const cartDrawer = $("#cart-drawer");

function cartKey(productId, optionIds) {
  return `${productId}:${[...optionIds].map(Number).sort((a, b) => a - b).join(",")}`;
}

function addToCart(product, optionIds) {
  const selection = product.optionGroups.map((group) => new Set(group.options.map((o) => Number(o.id)).filter((id) => optionIds.includes(id))));
  if (!selectionIsValid(product, selection)) return false;
  const ids = selection.flatMap((set) => [...set]);
  const key = cartKey(product.id, ids);
  const line = cart.get(key);
  if (line) line.quantity = Math.min(MAX_QUANTITY, line.quantity + 1);
  else cart.set(key, { productId: product.id, optionIds: ids, quantity: 1 });
  saveCart();
  renderCart();
  announce(`${product.name} adicionado à sacola. ${itemCountText()} na sacola.`);
  return true;
}

function cartItemCount() {
  return [...cart.values()].reduce((sum, line) => sum + line.quantity, 0);
}

function itemCountText() {
  return plural(cartItemCount(), "item", "itens");
}

function changeQuantity(key, delta) {
  const line = cart.get(key);
  if (!line) return;
  line.quantity = Math.max(1, Math.min(MAX_QUANTITY, line.quantity + delta));
  saveCart();
  renderCart();
}

function removeLine(key) {
  const line = cart.get(key);
  if (!line) return;
  const product = state.products.get(line.productId);
  cart.delete(key);
  saveCart();
  renderCart();
  announce(`${product?.name ?? "Produto"} removido da sacola.`);
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...cart.values()]));
  } catch {
    /* armazenamento indisponível (ex.: navegação privada): a sacola segue só nesta página */
  }
}

function loadCart() {
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    saved = [];
  }
  if (!Array.isArray(saved)) return;
  saved.forEach((entry) => {
    const line = Array.isArray(entry) ? entry[1] : entry; // aceita o formato antigo [chave, valor]
    const product = state.products.get(Number(line?.productId));
    if (!product) return;
    const quantity = Math.floor(Number(line.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) return;
    const ids = (Array.isArray(line.optionIds) ? line.optionIds : []).map(Number);
    const selection = product.optionGroups.map((group) => new Set(group.options.map((o) => Number(o.id)).filter((id) => ids.includes(id))));
    if (!selectionIsValid(product, selection)) return;
    const optionIds = selection.flatMap((set) => [...set]);
    const key = cartKey(product.id, optionIds);
    const existing = cart.get(key);
    cart.set(key, { productId: product.id, optionIds, quantity: Math.min(MAX_QUANTITY, (existing?.quantity ?? 0) + quantity) });
  });
}

function renderCart() {
  const count = cartItemCount();
  const countEl = $("#cart-count");
  countEl.textContent = String(count);
  countEl.dataset.count = String(count);
  $("#open-cart").setAttribute("aria-label", `Abrir sacola, ${plural(count, "item", "itens")}`);
  $("#cart-title-count").textContent = count ? `(${count})` : "";

  const active = document.activeElement;
  const focusKey = active?.closest?.("[data-line]")?.dataset.line;
  const focusAction = active?.dataset?.action;

  const list = $("#cart-lines");
  let subtotal = 0;
  const lines = [...cart.entries()].map(([key, line]) => {
    const product = state.products.get(line.productId);
    const unit = priceFor(product, line.optionIds);
    subtotal += unit * line.quantity;

    const item = el("li", "cart-line");
    item.dataset.line = key;
    const media = el("div", "cart-line__image");
    if (product.image) {
      const image = new Image(64, 64);
      image.alt = "";
      image.addEventListener("error", () => { if (image.src.includes("/thumbs/")) image.src = product.image; });
      image.src = thumbFor(product.image);
      media.append(image);
    }
    const info = el("div");
    info.append(el("p", "cart-line__name", product.name));
    if (product.optionGroups.length) info.append(el("p", "cart-line__options", optionSummary(product, line.optionIds)));

    const row = el("div", "cart-line__row");
    const qty = el("div", "qty");
    qty.setAttribute("role", "group");
    qty.setAttribute("aria-label", `Quantidade de ${product.name}`);
    const minus = el("button", "", "−");
    minus.type = "button";
    minus.dataset.action = "minus";
    minus.disabled = line.quantity <= 1;
    minus.setAttribute("aria-label", "Diminuir quantidade");
    minus.addEventListener("click", () => changeQuantity(key, -1));
    const output = el("output", "", String(line.quantity));
    output.setAttribute("aria-live", "polite");
    const plus = el("button", "", "+");
    plus.type = "button";
    plus.dataset.action = "plus";
    plus.disabled = line.quantity >= MAX_QUANTITY;
    plus.setAttribute("aria-label", "Aumentar quantidade");
    plus.addEventListener("click", () => changeQuantity(key, 1));
    qty.append(minus, output, plus);

    const total = el("span", "cart-line__total", money.format(unit * line.quantity));
    if (line.quantity > 1) total.append(el("span", "cart-line__unit", `${money.format(unit)} cada`));
    row.append(qty, total);

    const remove = el("button", "text-button cart-line__remove", "Remover");
    remove.type = "button";
    remove.dataset.action = "remove";
    remove.setAttribute("aria-label", `Remover ${product.name} da sacola`);
    remove.addEventListener("click", () => removeLine(key));

    info.append(row, remove);
    item.append(media, info);
    return item;
  });
  list.replaceChildren(...lines);

  $("#cart-subtotal").textContent = money.format(subtotal);
  $("#cart-empty").hidden = cart.size > 0;
  $("#cart-foot").hidden = cart.size === 0;
  list.hidden = cart.size === 0;

  if (focusKey && cartDrawer.open) {
    const line = [...list.children].find((node) => node.dataset.line === focusKey);
    const target = line?.querySelector(`[data-action="${focusAction}"]:not(:disabled)`) || line?.querySelector("button:not(:disabled)");
    (target || cartDrawer.querySelector("[data-close-dialog]"))?.focus();
  }
}

let clearArmed = null;
function clearCartClick(event) {
  const button = event.currentTarget;
  if (!clearArmed) {
    button.textContent = "Confirmar: esvaziar sacola";
    clearArmed = setTimeout(() => {
      button.textContent = "Esvaziar sacola";
      clearArmed = null;
    }, 4000);
    return;
  }
  clearTimeout(clearArmed);
  clearArmed = null;
  button.textContent = "Esvaziar sacola";
  cart.clear();
  saveCart();
  renderCart();
  announce("Sacola esvaziada.");
  cartDrawer.querySelector("#cart-empty [data-close-dialog]")?.focus();
}

/* ---------- Dialog helpers ---------- */

function openDialog(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  document.body.classList.add("has-dialog");
}

function setupDialog(dialog) {
  dialog.addEventListener("close", () => {
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("has-dialog");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
    if (event.target.closest("[data-close-dialog]")) dialog.close();
  });
}

/* ---------- Add-to-cart feedback ---------- */

let flights = 0;

function announce(message) {
  const region = $("#announcer");
  region.textContent = "";
  setTimeout(() => { region.textContent = message; }, 40);
}

function bumpCount() {
  const count = $("#cart-count");
  count.classList.remove("is-bump");
  void count.offsetWidth;
  count.classList.add("is-bump");
}

let toastTimer = null;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

function celebrateAdd(product, fromRect) {
  const target = $("#open-cart").getBoundingClientRect();
  const targetVisible = target.bottom > 0 && target.top < window.innerHeight && target.width > 0;
  const canFly = !reduceMotion.matches && targetVisible && product.image && fromRect && fromRect.width > 0 && flights < 4;

  if (!canFly) {
    bumpCount();
    if (reduceMotion.matches || !targetVisible) showToast(`${product.name} adicionado à sacola`);
    return;
  }

  const size = 64;
  const startX = fromRect.left + fromRect.width / 2 - size / 2;
  const startY = fromRect.top + fromRect.height / 2 - size / 2;
  const endX = target.left + target.width / 2 - size / 2;
  const endY = target.top + target.height / 2 - size / 2;
  const startScale = Math.max(0.8, Math.min(1.6, Math.min(fromRect.width, fromRect.height) / size));

  // Três camadas: a externa anda na horizontal, a do meio na vertical (easings diferentes formam um arco)
  // e a imagem só encolhe e esmaece perto do fim.
  const outer = el("div");
  outer.style.cssText = "position:fixed;left:0;top:0;z-index:1000;pointer-events:none;";
  outer.setAttribute("aria-hidden", "true");
  const middle = el("div");
  const flyer = new Image(size, size);
  flyer.className = "fly";
  flyer.addEventListener("error", () => { if (flyer.src.includes("/thumbs/")) flyer.src = product.image; });
  flyer.src = thumbFor(product.image);
  flyer.alt = "";
  flyer.style.position = "static";
  middle.append(flyer);
  outer.append(middle);
  document.body.append(outer);
  flights += 1;

  const duration = 640;
  const horizontal = outer.animate(
    [{ transform: `translateX(${startX}px)` }, { transform: `translateX(${endX}px)` }],
    { duration, easing: "cubic-bezier(0.45, 0, 0.75, 0.55)", fill: "forwards" },
  );
  middle.animate(
    [{ transform: `translateY(${startY}px)` }, { transform: `translateY(${endY}px)` }],
    { duration, easing: "cubic-bezier(0.25, 0.65, 0.45, 1)", fill: "forwards" },
  );
  flyer.animate(
    [
      { transform: `scale(${startScale})`, opacity: 1 },
      { transform: `scale(${startScale * 0.82})`, opacity: 1, offset: 0.35 },
      { transform: "scale(0.3)", opacity: 0.5 },
    ],
    { duration, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" },
  );

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    outer.remove();
    flights -= 1;
    bumpCount();
  };
  horizontal.finished.then(finish, finish);
  setTimeout(finish, duration + 400);
}

/* ---------- Hero ---------- */

function setupHero() {
  const image = $("#hero-image");
  const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => image.classList.add("is-in")));
  if (image.complete && image.naturalWidth > 0) reveal();
  else {
    image.addEventListener("load", reveal, { once: true });
    image.addEventListener("error", () => image.classList.add("is-in"), { once: true });
  }
  $("#hero-product").addEventListener("click", () => {
    const product = state.products.get(HERO_PRODUCT_ID);
    if (product) openProduct(product);
    else $("#produtos").scrollIntoView();
  });
}

/* ---------- Page wiring ---------- */

function setupPage() {
  setupDialog(productDialog);
  setupDialog(cartDrawer);

  $("#detail-add").addEventListener("click", addFromDetail);
  $("#gallery-prev").addEventListener("click", () => stepPhoto(-1));
  $("#gallery-next").addEventListener("click", () => stepPhoto(1));
  productDialog.addEventListener("close", () => {
    if (!productDialog.open) detail = null;
  });

  $("#open-cart").addEventListener("click", () => {
    renderCart();
    openDialog(cartDrawer);
  });
  $("#cart-clear").addEventListener("click", clearCartClick);
  cartDrawer.addEventListener("close", () => {
    if (clearArmed) {
      clearTimeout(clearArmed);
      clearArmed = null;
      $("#cart-clear").textContent = "Esvaziar sacola";
    }
  });

  let searchTimer = null;
  $("#product-search").addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = event.target.value;
      applyFilters();
    }, 120);
  });
  $("#product-sort").addEventListener("change", (event) => {
    state.sort = event.target.value;
    applyFilters();
  });
  $("#clear-filters").addEventListener("click", clearFilters);
  $("#empty-clear").addEventListener("click", () => {
    clearFilters();
    $("#product-search").focus();
  });

  const nav = $("#main-nav");
  const menuButton = $("#menu-button");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
  };
  menuButton.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    if (link.dataset.navGroup) setGroup(link.dataset.navGroup);
    closeMenu();
  });
  document.addEventListener("click", (event) => {
    if (nav.classList.contains("is-open") && !event.target.closest("#main-nav, #menu-button")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
    const tag = document.activeElement?.tagName;
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag) && !document.querySelector("dialog[open]")) {
      event.preventDefault();
      $("#product-search").focus();
    }
  });
}

function formatCollectedAt(value) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

async function loadData() {
  try {
    const [catalogResponse, showcaseResponse] = await Promise.all([fetch("./catalogo.json", { cache: "no-cache" }), fetch("./vitrine.json", { cache: "no-cache" })]);
    if (!catalogResponse.ok || !showcaseResponse.ok) throw new Error("Dados indisponíveis");
    const catalog = await catalogResponse.json();
    const showcase = await showcaseResponse.json();
    const byId = new Map((catalog.products ?? []).map((product) => [Number(product.id), product]));

    state.groups = (showcase.groups ?? []).map((group) => {
      const products = [];
      (group.productIds ?? []).forEach((id) => {
        const raw = byId.get(Number(id));
        if (!raw || !Number.isFinite(Number(raw.price)) || state.products.has(Number(id))) return;
        const product = makeProduct(raw, group, products.length, showcase.nomesDeExibicao);
        products.push(product);
        state.products.set(product.id, product);
      });
      return { id: group.id, name: group.name, title: group.title || group.name, intro: group.intro, products };
    }).filter((group) => group.products.length > 0);

    const collected = formatCollectedAt(catalog.collectedAt);
    if (collected) $("#collected-at").textContent = collected;

    buildCatalog();
    buildCategoryChips();
    applyFilters();
    loadCart();
    renderCart();
  } catch (error) {
    $("#catalog-status").textContent = "Produtos indisponíveis no momento.";
    $("#catalog-error").hidden = false;
    console.error(error);
  }
}

setupHero();
setupPage();
loadData();
