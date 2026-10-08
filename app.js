let products = [];
let storeData = {};
let fullCatalogOpen = false;
let activeCategory = "Todos";
let activeProduct = null;
let activePhoto = 0;
let selectedOptionIds = new Set();
let fulfillmentChoice = null;
let paymentChoice = null;

const cart = new Map();
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const productGrid = document.querySelector("#product-grid");
const featuredGrid = document.querySelector("#featured-grid");
const searchInput = document.querySelector("#product-search");
const categoryList = document.querySelector("#category-list");
const cartDrawer = document.querySelector("#cart-drawer");
const overlay = document.querySelector("#overlay");
const checkoutDialog = document.querySelector("#checkout-dialog");
const productDialog = document.querySelector("#product-dialog");

function setCatalogCount(count) {
  const noun = count === 1 ? "produto" : "produtos";
  document.querySelector("#catalog-count").textContent = `${count} ${noun} na referência Guaíba`;
}

function searchableText(product) {
  const optionNames = (product.options ?? []).flatMap((group) => group.options.map((option) => option.label)).join(" ");
  return `${product.name} ${product.brand ?? ""} ${product.category ?? ""} ${product.description ?? ""} ${optionNames}`.toLocaleLowerCase("pt-BR");
}

function optionCount(product) {
  return (product.options ?? []).reduce((sum, group) => sum + group.options.length, 0);
}

function productPrice(product, optionIds = []) {
  const selected = new Set(optionIds.map(Number));
  return Number(product.price) + (product.options ?? []).flatMap((group) => group.options).reduce((sum, option) => sum + (selected.has(Number(option.id)) ? Number(option.price || 0) : 0), 0);
}

function optionNames(product, optionIds = []) {
  const selected = new Set(optionIds.map(Number));
  return (product.options ?? []).flatMap((group) => group.options.filter((option) => selected.has(Number(option.id))).map((option) => option.label));
}

function renderCategories() {
  const categories = ["Todos", ...new Set(products.map((product) => product.category).filter(Boolean))];
  categoryList.replaceChildren();
  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `category-chip${category === activeCategory ? " category-chip--active" : ""}`;
    button.textContent = category;
    button.dataset.category = category;
    categoryList.append(button);
  });
  categoryList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    activeCategory = button.dataset.category;
    categoryList.querySelectorAll("[data-category]").forEach((chip) => chip.classList.toggle("category-chip--active", chip === button));
    renderProducts();
  });
}

function renderFeatured() {
  const featured = products.filter((product) => product.featured).slice(0, 4);
  featuredGrid.replaceChildren(...featured.map((product) => createProductCard(product, true)));
  document.querySelector("#featured-total").textContent = products.length;
}

function createProductCard(product, isFeatured = false) {
  const card = document.createElement("article");
  card.className = `product-card${isFeatured ? " product-card--featured" : ""}`;

  const openDetails = document.createElement("button");
  openDetails.type = "button";
  openDetails.className = "product-card__open";
  openDetails.setAttribute("aria-label", `Ver detalhes de ${product.name}`);
  openDetails.addEventListener("click", () => openProduct(product));

  const imageWrap = document.createElement("span");
  imageWrap.className = "product-card__image";
  const image = document.createElement("img");
  image.src = product.image || "";
  image.alt = product.name;
  image.loading = "lazy";
  image.onerror = () => { image.hidden = true; imageWrap.classList.add("product-card__image--missing"); };
  imageWrap.append(image);

  const body = document.createElement("span");
  body.className = "product-card__body";
  const category = document.createElement("span");
  category.className = "product-card__category";
  category.textContent = product.category;
  const title = document.createElement("strong");
  title.className = "product-card__title";
  title.textContent = product.name;
  const brand = document.createElement("span");
  brand.className = "product-card__brand";
  brand.textContent = product.brand || "Marca não informada no cadastro";
  body.append(category, title, brand);
  openDetails.append(imageWrap, body);

  const bottom = document.createElement("div");
  bottom.className = "product-card__bottom";
  const priceWrap = document.createElement("div");
  const price = document.createElement("strong");
  price.className = "product-card__price";
  price.textContent = money.format(product.price);
  const unit = document.createElement("small");
  unit.className = "product-card__unit";
  const count = optionCount(product);
  unit.textContent = count ? `${count} opções · ref. Guaíba` : "Preço ref. Guaíba";
  priceWrap.append(price, unit);
  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = count ? "add-button add-button--label" : "add-button";
  addButton.textContent = count ? "Escolher" : "+";
  addButton.setAttribute("aria-label", count ? `Escolher opções de ${product.name}` : `Adicionar ${product.name} à sacola`);
  addButton.addEventListener("click", () => {
    if (count) openProduct(product);
    else addToCart(product, []);
  });
  bottom.append(priceWrap, addButton);
  card.append(openDetails, bottom);
  return card;
}

function currentProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const sort = document.querySelector("#product-sort").value;
  let result = products.filter((product) => {
    const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
    return matchesCategory && (!query || searchableText(product).includes(query));
  });
  if (sort === "price-low") result = result.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name, "pt-BR"));
  if (sort === "price-high") result = result.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name, "pt-BR"));
  if (sort === "name") result = result.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  return result;
}

function renderProducts() {
  const visibleProducts = currentProducts();
  productGrid.replaceChildren(...visibleProducts.map((product) => createProductCard(product)));
  setCatalogCount(visibleProducts.length);
  document.querySelector("#no-results").hidden = visibleProducts.length > 0;
}

function openFullCatalog() {
  if (!fullCatalogOpen) {
    fullCatalogOpen = true;
    document.querySelector("#catalog-controls").hidden = false;
    document.querySelector("#catalog-toolbar").hidden = false;
    document.querySelector("#product-grid").hidden = false;
    document.querySelector("#catalog-footnote").hidden = false;
    document.querySelector("#catalog-teaser").hidden = true;
    renderProducts();
  }
}

function renderGallery() {
  if (!activeProduct) return;
  const imageUrls = activeProduct.images?.length ? activeProduct.images : [activeProduct.image];
  const image = document.querySelector("#detail-image");
  image.src = imageUrls[activePhoto] || "";
  image.alt = `${activeProduct.name} · foto ${activePhoto + 1}`;
  const hasMultiple = imageUrls.length > 1;
  document.querySelector("#gallery-prev").hidden = !hasMultiple;
  document.querySelector("#gallery-next").hidden = !hasMultiple;
  const dots = document.querySelector("#gallery-dots");
  dots.replaceChildren(...imageUrls.map((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `gallery-dot${index === activePhoto ? " gallery-dot--active" : ""}`;
    button.setAttribute("aria-label", `Ver foto ${index + 1}`);
    button.addEventListener("click", () => { activePhoto = index; renderGallery(); });
    return button;
  }));
}

function renderOptionGroups(product) {
  const container = document.querySelector("#detail-option-groups");
  container.replaceChildren();
  (product.options ?? []).forEach((group, groupIndex) => {
    const section = document.createElement("fieldset");
    section.className = "option-group";
    const legend = document.createElement("legend");
    legend.textContent = group.label || "Escolha uma opção";
    const hint = document.createElement("small");
    hint.className = "option-group__hint";
    const max = group.multiple ? Math.min(Number(group.maximum) || group.options.length, group.options.length) : 1;
    hint.textContent = group.multiple ? `Escolha ${group.minimum || 0} a ${max} opções` : group.required ? "Escolha uma opção" : "Opcional";
    section.append(legend, hint);
    const choices = document.createElement("div");
    choices.className = group.multiple ? "option-choices option-choices--checks" : "option-choices";
    const inputType = group.multiple ? "checkbox" : "radio";
    const groupName = `option-${product.id}-${groupIndex}`;
    const inputOptions = [...group.options];
    if (!group.required && !group.multiple) inputOptions.unshift({ id: "none", label: "Sem preferência", noPreference: true });
    inputOptions.forEach((option, index) => {
      const label = document.createElement("label");
      label.className = "option-choice";
      const input = document.createElement("input");
      input.type = inputType;
      input.name = groupName;
      input.value = String(option.id);
      input.dataset.noPreference = String(Boolean(option.noPreference));
      input.addEventListener("change", () => {
        if (group.multiple) {
          const chosen = [...choices.querySelectorAll("input:checked")];
          if (chosen.length > max) {
            input.checked = false;
            return;
          }
          const selectedForGroup = new Set(chosen.filter((entry) => entry.dataset.noPreference !== "true").map((entry) => Number(entry.value)));
          product.options[groupIndex].options.forEach((entry) => selectedOptionIds.delete(Number(entry.id)));
          selectedForGroup.forEach((entry) => selectedOptionIds.add(entry));
        } else {
          product.options[groupIndex].options.forEach((entry) => selectedOptionIds.delete(Number(entry.id)));
          if (!option.noPreference) selectedOptionIds.add(Number(option.id));
        }
        updateDetailPurchaseState();
      });
      const copy = document.createElement("span");
      copy.textContent = option.label;
      label.append(input, copy);
      choices.append(label);
    });
    section.append(choices);
    container.append(section);
  });
}

function openProduct(product) {
  activeProduct = product;
  activePhoto = 0;
  selectedOptionIds = new Set();
  document.querySelector("#detail-category").textContent = product.category;
  document.querySelector("#product-dialog-title").textContent = product.name;
  document.querySelector("#detail-brand").textContent = product.brand || "Marca não informada no cadastro da loja.";
  document.querySelector("#detail-description").textContent = product.description || "Descrição não informada na loja.";
  document.querySelector("#detail-price").textContent = money.format(product.price);
  document.querySelector("#product-source-link").href = product.sourceUrl;
  renderGallery();
  renderOptionGroups(product);
  updateDetailPurchaseState();
  productDialog.showModal();
}

function updateDetailPurchaseState() {
  const add = document.querySelector("#detail-add");
  const price = document.querySelector("#detail-price");
  if (!activeProduct) return;
  const requiredOptionsSelected = (activeProduct.options ?? []).every((group) => {
    const count = group.options.filter((option) => selectedOptionIds.has(Number(option.id))).length;
    return count >= Number(group.minimum || 0);
  });
  price.textContent = money.format(productPrice(activeProduct, [...selectedOptionIds]));
  add.disabled = !requiredOptionsSelected;
}

function cartKey(productId, optionIds) {
  return JSON.stringify([Number(productId), [...optionIds].map(Number).sort((a, b) => a - b)]);
}

function addToCart(product, optionIds) {
  const key = cartKey(product.id, optionIds);
  const existing = cart.get(key);
  cart.set(key, { productId: Number(product.id), optionIds: optionIds.map(Number), quantity: (existing?.quantity ?? 0) + 1 });
  saveCart();
  renderCart();
  if (productDialog.open) productDialog.close();
  openCart();
}

function saveCart() {
  try { localStorage.setItem("materia-prima-demo-cart", JSON.stringify([...cart.entries()])); } catch { /* storage can be disabled in private browsing */ }
}

function loadSavedCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("materia-prima-demo-cart") || "[]");
    saved.forEach(([key, value]) => {
      if (products.some((product) => Number(product.id) === Number(value.productId)) && Number(value.quantity) > 0) cart.set(key, value);
    });
  } catch { /* ignore an invalid or unavailable local cart */ }
}

function changeQuantity(key, delta) {
  const item = cart.get(key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart.delete(key);
  else cart.set(key, item);
  saveCart();
  renderCart();
}

function createCartLine(key, entry) {
  const product = products.find((item) => Number(item.id) === Number(entry.productId));
  if (!product) return null;
  const chosenNames = optionNames(product, entry.optionIds);
  const line = document.createElement("div");
  line.className = "cart-line";
  const image = document.createElement("img");
  image.src = product.image;
  image.alt = "";
  const details = document.createElement("div");
  details.className = "cart-line__details";
  const title = document.createElement("strong");
  title.textContent = product.name;
  const meta = document.createElement("small");
  meta.textContent = `${chosenNames.length ? chosenNames.join(", ") : "Sem opção"} · ${money.format(productPrice(product, entry.optionIds))} cada`;
  const controls = document.createElement("div");
  controls.className = "quantity-control";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "−";
  minus.setAttribute("aria-label", `Remover uma unidade de ${product.name}`);
  minus.addEventListener("click", () => changeQuantity(key, -1));
  const quantity = document.createElement("span");
  quantity.textContent = String(entry.quantity);
  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.setAttribute("aria-label", `Adicionar uma unidade de ${product.name}`);
  plus.addEventListener("click", () => changeQuantity(key, 1));
  controls.append(minus, quantity, plus);
  details.append(title, meta, controls);
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "cart-line__remove";
  remove.textContent = "Remover";
  remove.addEventListener("click", () => { cart.delete(key); saveCart(); renderCart(); });
  line.append(image, details, remove);
  return line;
}

function renderCart() {
  const container = document.querySelector("#cart-items");
  const entries = [...cart.entries()];
  container.replaceChildren(...entries.map(([key, entry]) => createCartLine(key, entry)).filter(Boolean));
  const itemCount = entries.reduce((sum, [, entry]) => sum + entry.quantity, 0);
  const subtotal = entries.reduce((sum, [, entry]) => {
    const product = products.find((item) => Number(item.id) === Number(entry.productId));
    return sum + (product ? productPrice(product, entry.optionIds) * entry.quantity : 0);
  }, 0);
  document.querySelector("#cart-count").textContent = String(itemCount);
  document.querySelector("#cart-title-count").textContent = itemCount ? `(${itemCount})` : "";
  document.querySelector("#cart-subtotal").textContent = money.format(subtotal);
  document.querySelector("#cart-empty").hidden = entries.length > 0;
  container.hidden = entries.length === 0;
  document.querySelector("#cart-checkout").disabled = entries.length === 0;
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  overlay.hidden = false;
  document.body.classList.add("has-overlay");
  document.querySelector("#open-cart").setAttribute("aria-expanded", "true");
  document.querySelector("#close-cart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.classList.remove("has-overlay");
  document.querySelector("#open-cart").setAttribute("aria-expanded", "false");
}

function renderPaymentChoices() {
  const container = document.querySelector("#payment-options");
  const methods = storeData.fulfillment?.paymentMethods ?? [];
  const choices = methods.flatMap((method) => method.formats.map((format) => ({ group: method.label, label: format })));
  container.replaceChildren();
  choices.forEach((choice) => {
    const label = document.createElement("label");
    label.className = "payment-option";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "demo-payment";
    input.value = choice.label;
    input.addEventListener("change", () => { paymentChoice = choice; updateCheckoutButton(); });
    const text = document.createElement("span");
    text.textContent = choice.label;
    label.append(input, text);
    container.append(label);
  });
}

function updateCheckoutButton() {
  const addressFields = ["delivery-cep", "delivery-street", "delivery-number", "delivery-neighborhood", "delivery-city"];
  const addressReady = fulfillmentChoice !== "delivery" || addressFields.every((id) => document.querySelector(`#${id}`).value.trim());
  document.querySelector("#continue-review").disabled = !fulfillmentChoice || !paymentChoice || !addressReady;
}

function openCheckout() {
  closeCart();
  fulfillmentChoice = null;
  paymentChoice = null;
  document.querySelectorAll("[data-fulfillment]").forEach((button) => button.classList.remove("is-selected"));
  document.querySelectorAll("input[name='demo-payment']").forEach((input) => { input.checked = false; });
  document.querySelector("#continue-review").disabled = true;
  document.querySelector("#address-preview").hidden = true;
  ["delivery-cep", "delivery-street", "delivery-number", "delivery-neighborhood", "delivery-city"].forEach((id) => { document.querySelector(`#${id}`).value = ""; });
  document.querySelector("#step-fulfillment").hidden = false;
  document.querySelector("#step-review").hidden = true;
  document.querySelector("#step-dot-1").classList.add("step-indicator__active");
  document.querySelector("#step-dot-2").classList.remove("step-indicator__active");
  if (!checkoutDialog.open) checkoutDialog.showModal();
}

function clearDemoAddress() {
  ["delivery-cep", "delivery-street", "delivery-number", "delivery-neighborhood", "delivery-city"].forEach((id) => { document.querySelector(`#${id}`).value = ""; });
}

function renderReview() {
  const entries = [...cart.entries()];
  const lines = document.querySelector("#review-lines");
  lines.replaceChildren();
  let subtotal = 0;
  entries.forEach(([, entry]) => {
    const product = products.find((item) => Number(item.id) === Number(entry.productId));
    if (!product) return;
    const unitPrice = productPrice(product, entry.optionIds);
    const lineTotal = unitPrice * entry.quantity;
    subtotal += lineTotal;
    const row = document.createElement("div");
    row.className = "review-line";
    const text = document.createElement("span");
    const flavors = optionNames(product, entry.optionIds);
    text.textContent = `${entry.quantity} × ${product.name}${flavors.length ? ` · ${flavors.join(", ")}` : ""}`;
    const total = document.createElement("strong");
    total.textContent = money.format(lineTotal);
    row.append(text, total);
    lines.append(row);
  });
  document.querySelector("#review-fulfillment").textContent = fulfillmentChoice === "delivery" ? "Entrega · referência Guaíba" : "Retirada · referência Guaíba";
  if (fulfillmentChoice === "delivery") {
    const address = ["delivery-street", "delivery-number", "delivery-neighborhood", "delivery-city", "delivery-cep"].map((id) => document.querySelector(`#${id}`).value.trim()).filter(Boolean).join(", ");
    document.querySelector("#review-location").textContent = `${address} · exemplo não validado`;
  } else {
    document.querySelector("#review-location").textContent = "Local e horário de Passo Fundo não confirmados";
  }
  document.querySelector("#review-payment").textContent = paymentChoice ? `${paymentChoice.label} · formato cadastrado em Guaíba` : "Não selecionado";
  document.querySelector("#review-subtotal").textContent = money.format(subtotal);
  document.querySelector("#review-total").textContent = `${money.format(subtotal)} + frete/condições locais pendentes`;
}

function showReview() {
  renderReview();
  document.querySelector("#step-fulfillment").hidden = true;
  document.querySelector("#step-review").hidden = false;
  document.querySelector("#step-dot-1").classList.add("step-indicator__active");
  document.querySelector("#step-dot-2").classList.add("step-indicator__active");
}

function renderReferenceFees() {
  const container = document.querySelector("#fee-reference-list");
  const fees = storeData.fulfillment?.delivery?.fees ?? [];
  const grouped = new Map();
  fees.forEach((fee) => {
    const entries = grouped.get(fee.city) ?? [];
    entries.push(fee);
    grouped.set(fee.city, entries);
  });
  const blocks = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR")).map(([city, entries]) => {
    const block = document.createElement("section");
    const title = document.createElement("h4");
    title.textContent = `${city}, ${entries[0]?.state}`;
    const list = document.createElement("ul");
    entries.sort((a, b) => a.area.localeCompare(b.area, "pt-BR")).forEach((fee) => {
      const line = document.createElement("li");
      const areaName = fee.area === "Passo Fundo" && city === "Guaíba" ? "Passo Fundo (bairro cadastrado em Guaíba)" : fee.area;
      line.textContent = `${areaName} · ${fee.isFree ? "grátis" : money.format(fee.fee)}`;
      list.append(line);
    });
    block.append(title, list);
    return block;
  });
  container.replaceChildren(...blocks);
}

function openFromPage() {
  document.querySelector("#open-full-catalog").addEventListener("click", openFullCatalog);
  document.querySelector("#open-full-catalog-inline").addEventListener("click", () => { openFullCatalog(); document.querySelector("#catalog-toolbar").scrollIntoView({ behavior: "smooth", block: "start" }); });
  document.querySelector("#product-search").addEventListener("input", () => { openFullCatalog(); renderProducts(); });
  document.querySelector("#product-sort").addEventListener("change", renderProducts);
  document.querySelector("#open-cart").addEventListener("click", openCart);
  document.querySelector("#close-cart").addEventListener("click", closeCart);
  document.querySelector("#browse-products").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  document.querySelector("#cart-checkout").addEventListener("click", openCheckout);
  document.querySelector("#open-checkout").addEventListener("click", openCheckout);
  checkoutDialog.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => { clearDemoAddress(); checkoutDialog.close(); }));
  checkoutDialog.querySelector(".dialog-close-row button").addEventListener("click", clearDemoAddress);
  document.querySelector("#detail-add").addEventListener("click", () => { if (activeProduct) addToCart(activeProduct, [...selectedOptionIds]); });
  document.querySelector("#gallery-prev").addEventListener("click", () => { activePhoto = (activePhoto + activeProduct.images.length - 1) % activeProduct.images.length; renderGallery(); });
  document.querySelector("#gallery-next").addEventListener("click", () => { activePhoto = (activePhoto + 1) % activeProduct.images.length; renderGallery(); });
  document.querySelectorAll("[data-fulfillment]").forEach((button) => button.addEventListener("click", () => {
    fulfillmentChoice = button.dataset.fulfillment;
    document.querySelectorAll("[data-fulfillment]").forEach((choice) => choice.classList.toggle("is-selected", choice === button));
    document.querySelector("#address-preview").hidden = fulfillmentChoice !== "delivery";
    if (fulfillmentChoice === "pickup") ["delivery-cep", "delivery-street", "delivery-number", "delivery-neighborhood", "delivery-city"].forEach((id) => { document.querySelector(`#${id}`).value = ""; });
    updateCheckoutButton();
  }));
  ["delivery-cep", "delivery-street", "delivery-number", "delivery-neighborhood", "delivery-city"].forEach((id) => document.querySelector(`#${id}`).addEventListener("input", updateCheckoutButton));
  checkoutDialog.addEventListener("close", clearDemoAddress);
  document.querySelector("#continue-review").addEventListener("click", showReview);
  document.querySelector("#back-to-fulfillment").addEventListener("click", () => {
    document.querySelector("#step-review").hidden = true;
    document.querySelector("#step-fulfillment").hidden = false;
  });
  document.querySelectorAll(".main-nav a, .mobile-nav a").forEach((link) => link.addEventListener("click", () => {
    if (link.getAttribute("href") === "#catalogo") openFullCatalog();
    document.querySelector("#mobile-nav").hidden = true;
    document.querySelector("#menu-button").setAttribute("aria-expanded", "false");
  }));
  document.querySelector("#menu-button").addEventListener("click", (event) => {
    const menu = document.querySelector("#mobile-nav");
    menu.hidden = !menu.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!menu.hidden));
  });
  document.addEventListener("keydown", (event) => {
    const activeElement = document.activeElement;
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(activeElement?.tagName) && !checkoutDialog.open && !productDialog.open) {
      event.preventDefault();
      openFullCatalog();
      searchInput.focus();
    }
    if (event.key === "Escape") closeCart();
  });
}

async function loadCatalog() {
  try {
    const response = await fetch("./catalogo.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Catálogo indisponível");
    storeData = await response.json();
    products = Array.isArray(storeData.products) ? storeData.products.filter((product) => Number.isFinite(Number(product.price)) && product.image) : [];
  } catch {
    products = [];
  }
  document.querySelector("#catalog-teaser-count").textContent = `${products.length} produtos em ${new Set(products.map((product) => product.category)).size} categorias`;
  renderCategories();
  renderFeatured();
  renderProducts();
  renderPaymentChoices();
  renderReferenceFees();
  loadSavedCart();
  renderCart();
}

openFromPage();
loadCatalog();
