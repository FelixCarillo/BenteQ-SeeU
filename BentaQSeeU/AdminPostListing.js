document.addEventListener("DOMContentLoaded", () => {
  const session = requireAdmin();
  if (!session) return;

  const params = new URLSearchParams(location.search);
  const editId = params.get("id") ? Number(params.get("id")) : null;
  const editing = editId ? AdminDB.find(editId) : null;

  if (editId && !editing) {
    location.replace("AdminDashboard.html");
    return;
  }

  const form = document.getElementById("post-form");
  const heading = document.getElementById("post-heading");
  const saveBtn = document.getElementById("save-btn");
  const imageFields = document.getElementById("image-fields");
  const addImageBtn = document.getElementById("add-image-btn");
  const preview = document.getElementById("post-preview");

  const f = {
    name: document.getElementById("f-name"),
    category: document.getElementById("f-category"),
    condition: document.getElementById("f-condition"),
    price: document.getElementById("f-price"),
    badge: document.getElementById("f-badge"),
    description: document.getElementById("f-description"),
    tags: document.getElementById("f-tags"),
    sellerName: document.getElementById("f-seller-name"),
    sellerHandle: document.getElementById("f-seller-handle"),
    sellerCampus: document.getElementById("f-seller-campus"),
    sellerAvatar: document.getElementById("f-seller-avatar"),
    postUrl: document.getElementById("f-postUrl"),
    date: document.getElementById("f-date"),
  };

  if (editing) {
    heading.textContent = "Edit listing";
    saveBtn.textContent = "Save changes";
    document.title = "Edit listing — Benta Q, See U";
    f.name.value = editing.name || "";
    f.category.value = editing.category || "";
    f.condition.value = editing.condition || "";
    f.price.value = editing.price ?? "";
    f.badge.value = editing.badge || "";
    f.description.value = editing.description || "";
    f.tags.value = (editing.tags || []).join(", ");
    f.sellerName.value = editing.seller?.name || "";
    f.sellerHandle.value = editing.seller?.handle || "";
    f.sellerCampus.value = editing.seller?.campus || "";
    f.sellerAvatar.value = editing.seller?.avatar || "";
    f.postUrl.value = editing.postUrl || "";
    f.date.value = (editing.datePosted || "").slice(0, 10) || today();
    renderImageFields(
      editing.images?.length ? editing.images : ["", "", "", ""],
    );
  } else {
    f.date.value = today();
    renderImageFields(["", "", "", ""]);
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  // ---- image fields ----
  function renderImageFields(urls) {
    imageFields.innerHTML = "";
    urls.forEach((url) => imageFields.appendChild(makeImageField(url)));
  }

  function makeImageField(url) {
    const wrap = document.createElement("div");
    wrap.className = "post-image-slot";
    wrap.innerHTML = `
      <div class="post-image-thumb">
        ${url ? `<img src="${escapeAttr(url)}" alt="" />` : `<span>No image</span>`}
      </div>
      <div class="post-image-controls">
        <input type="url" class="img-url" placeholder="Image URL" value="${escapeAttr(url)}" />
        <label class="img-upload">
          Upload
          <input type="file" accept="image/*" hidden />
        </label>
        <button type="button" class="post-img-remove" aria-label="Remove image">✕</button>
      </div>
    `;

    const urlInput = wrap.querySelector(".img-url");
    const thumb = wrap.querySelector(".post-image-thumb");
    const fileInput = wrap.querySelector("input[type=file]");
    const removeBtn = wrap.querySelector(".post-img-remove");

    urlInput.addEventListener("input", () => {
      thumb.innerHTML = urlInput.value
        ? `<img src="${escapeAttr(urlInput.value)}" alt="" />`
        : `<span>No image</span>`;
      updatePreview();
    });

    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (file.size > 1_500_000) {
        alert(
          "That image is larger than 1.5 MB. Use a smaller file or paste a URL.",
        );
        fileInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        urlInput.value = reader.result;
        thumb.innerHTML = `<img src="${escapeAttr(urlInput.value)}" alt="" />`;
        updatePreview();
      };
      reader.readAsDataURL(file);
    });

    removeBtn.addEventListener("click", () => {
      wrap.remove();
      updatePreview();
    });
    return wrap;
  }

  addImageBtn.addEventListener("click", () => {
    imageFields.appendChild(makeImageField(""));
    updatePreview();
  });

  // ---- collect + validate ----
  function collect() {
    const images = [...imageFields.querySelectorAll(".img-url")]
      .map((i) => i.value.trim())
      .filter(Boolean);
    const tags = f.tags.value
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const sellerName = f.sellerName.value.trim();
    const avatar =
      f.sellerAvatar.value.trim() ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(sellerName || "seller")}`;
    return {
      name: f.name.value.trim(),
      category: f.category.value.trim(),
      condition: f.condition.value.trim(),
      price: Number(f.price.value),
      badge: f.badge.value.trim(),
      description: f.description.value.trim(),
      tags,
      seller: {
        name: sellerName,
        handle: f.sellerHandle.value.trim(),
        campus: f.sellerCampus.value,
        avatar,
      },
      images,
      postUrl: f.postUrl.value.trim(),
      datePosted: (() => {
        const raw = f.date.value || today();
        const d = new Date(`${raw}T12:00:00`);
        return isNaN(d) ? new Date().toISOString() : d.toISOString();
      })(),
      viewCount: editing?.viewCount ?? 0,
    };
  }

  function validate(data) {
    if (!data.name) return "Please enter a product name.";
    if (!data.category) return "Please pick a category.";
    if (!data.condition) return "Please pick a condition.";
    if (!Number.isFinite(data.price) || data.price < 0)
      return "Please enter a valid price.";
    if (!data.description) return "Please add a description.";
    if (!data.seller.name) return "Please add the seller name.";
    if (!data.seller.campus) return "Please pick the campus.";
    if (data.images.length === 0) return "Please add at least one image.";
    return null;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    showError("");

    let data;
    try {
      data = collect();
    } catch (e) {
      console.error("[AdminPostListing] collect failed:", e);
      showError("Could not read the form: " + (e?.message || e));
      return;
    }

    const err = validate(data);
    if (err) {
      showError(err);
      return;
    }

    try {
      if (editing) {
        const result = AdminDB.update(editing.id, data);
        if (!result)
          throw new Error("Listing not found. It may have been deleted.");
      } else {
        AdminDB.create(data);
      }
    } catch (e) {
      console.error("[AdminPostListing] save failed:", e);
      showError(e?.message || "Save failed. Check the console for details.");
      return;
    }

    location.replace("AdminDashboard.html");
  });

  function showError(msg) {
    const banner = document.getElementById("post-error");
    if (!banner) return;
    if (!msg) {
      banner.hidden = true;
      banner.textContent = "";
      return;
    }
    banner.textContent = msg;
    banner.hidden = false;
    banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---- preview ----
  function updatePreview() {
    const data = collect();
    const firstImage = data.images[0] || "";
    const avatar =
      data.seller.avatar ||
      `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(data.seller.name || "seller")}`;
    preview.innerHTML = `
      <article class="preview-card">
        <header class="preview-header">
          <img src="${escapeAttr(avatar)}" alt="" class="preview-avatar" />
          <div>
            <span class="preview-seller">${escapeHtml(data.seller.name || "Seller name")}</span>
            <span class="preview-sub">${escapeHtml(data.seller.handle || "Section")} · ${escapeHtml(data.category || "Category")}</span>
          </div>
        </header>
        <div class="preview-media">
          ${
            firstImage
              ? `<img src="${escapeAttr(firstImage)}" alt="" />`
              : `<span class="preview-media-empty">Add an image</span>`
          }
        </div>
        <div class="preview-body">
          <h3>${escapeHtml(data.name || "Product name")}</h3>
          <p>${escapeHtml((data.description || "Description appears here…").slice(0, 120))}</p>
          <div class="preview-tags">
            ${[data.category, data.condition, data.badge]
              .filter(Boolean)
              .map((t) => `<span>${escapeHtml(t)}</span>`)
              .join("")}
          </div>
        </div>
        <div class="preview-footer">
          <strong>${formatPrice(data.price)}</strong>
          <span class="preview-campus">📍 ${escapeHtml(data.seller.campus || "Campus")}</span>
        </div>
      </article>
    `;
  }

  form.addEventListener("input", updatePreview);
  form.addEventListener("change", updatePreview);
  updatePreview();

  // helpers
  function escapeHtml(v) {
    return String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function escapeAttr(v) {
    return escapeHtml(v);
  }
  function formatPrice(v) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(Number(v) || 0);
  }
});
