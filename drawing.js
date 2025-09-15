(function () {
  const canvas = document.getElementById("draw");
  const colorPicker = document.getElementById("color");
  const sizeRange = document.getElementById("size");
  const modeSelect = document.getElementById("mode");
  const undoBtn = document.getElementById("undo");
  const clearBtn = document.getElementById("clear");
  const saveBtn = document.getElementById("save");

  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let drawing = false;
  let lastX = 0,
    lastY = 0;
  const undoStack = [];

  // 🔹 Retina setup
  function resizeCanvasForRetina() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any existing scale
    ctx.scale(ratio, ratio);

    // reset background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = parseInt(sizeRange.value, 10) || 6;
  }

  resizeCanvasForRetina();
  window.addEventListener("resize", resizeCanvasForRetina);

  function pushUndo() {
    try {
      undoStack.push(canvas.toDataURL("image/png"));
    } catch (_) {
      /* ignore */
    }
    if (undoStack.length > 30) undoStack.shift();
  }

  function restoreUndo() {
    const url = undoStack.pop();
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ✅ scale image to canvas size
      const rect = canvas.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = url;
  }

  function setBrushFromControls() {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = parseInt(sizeRange.value, 10) || 6;
    if (modeSelect.value === "erase") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = colorPicker.value;
    }
  }

  // 🔹 FIXED: no double-scaling, just return CSS pixel coordinates
  function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const isTouch = e.touches || e.changedTouches;
    const clientX = isTouch
      ? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX
      : e.clientX;
    const clientY = isTouch
      ? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY
      : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDrawing(e) {
    e.preventDefault();
    pushUndo();
    drawing = true;
    const p = getPointerPos(e);
    lastX = p.x;
    lastY = p.y;
    setBrushFromControls();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const p = getPointerPos(e);
    setBrushFromControls();
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastX = p.x;
    lastY = p.y;
  }

  function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    ctx.closePath();
  }

  // Mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", stopDrawing);

  // Touch events
  canvas.addEventListener("touchstart", startDrawing, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", stopDrawing);

  // Controls
  colorPicker.addEventListener("change", () => {
    if (modeSelect.value === "draw") ctx.strokeStyle = colorPicker.value;
  });
  sizeRange.addEventListener("input", setBrushFromControls);
  modeSelect.addEventListener("change", setBrushFromControls);

  undoBtn.addEventListener("click", restoreUndo);
  clearBtn.addEventListener("click", () => {
    pushUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    resizeCanvasForRetina(); // refill bg
  });

  saveBtn.addEventListener("click", () => {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "drawing.png";
    a.click();
  });

  // Keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      restoreUndo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveBtn.click();
    }
  });
})();
