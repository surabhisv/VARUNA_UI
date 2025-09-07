// script.js

document.addEventListener("DOMContentLoaded", () => {
  const appDrawerToggle = document.getElementById("appDrawerToggle");
  const appDrawer = document.getElementById("appDrawer");
  const windows = document.querySelectorAll(".window");
  const taskbar = document.getElementById("taskbar");

  // Toggle app drawer visibility
  appDrawerToggle.addEventListener("click", () => {
    appDrawer.classList.toggle("hidden");
  });

  // Function to bring window to front (z-index)
  let zIndexCounter = 10;
  function bringToFront(win) {
    zIndexCounter++;
    win.style.zIndex = zIndexCounter;
    windows.forEach(w => w.classList.remove("active"));
    win.classList.add("active");
  }

  // Open windows from app drawer buttons
  appDrawer.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-window");
      const targetWin = document.getElementById(targetId);
      if (!targetWin) return;
      // Show the window and bring to front
      targetWin.style.display = "flex";
      bringToFront(targetWin);
      appDrawer.classList.add("hidden");
      // Remove minimized button if exists (to avoid duplicates)
      removeTaskbarButton(targetId);
    });
  });

  // Create taskbar button for minimized windows
  function addTaskbarButton(win) {
    const id = win.id;
    // Avoid duplicate buttons
    if (taskbar.querySelector(`button[data-window="${id}"]`)) return;

    const btn = document.createElement("button");
    btn.textContent = win.getAttribute("data-title") || id;
    btn.setAttribute("data-window", id);
    btn.title = `Restore ${btn.textContent}`;
    btn.style.color = "#39ff14";
    btn.style.background = "transparent";
    btn.style.border = "1px solid #39ff14";
    btn.style.padding = "4px 8px";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => {
      win.style.display = "flex";
      bringToFront(win);
      btn.remove();
    });

    taskbar.appendChild(btn);
  }

  // Remove taskbar button
  function removeTaskbarButton(winId) {
    const btn = taskbar.querySelector(`button[data-window="${winId}"]`);
    if (btn) btn.remove();
  }

  // Window controls: minimize, maximize, close
  windows.forEach(win => {
    const minimizeBtn = win.querySelector(".minimize-btn");
    const maximizeBtn = win.querySelector(".maximize-btn");
    const closeBtn = win.querySelector(".close-btn");

    let isMaximized = false;
    let lastPosition = null;

    minimizeBtn.addEventListener("click", () => {
      win.style.display = "none";
      addTaskbarButton(win);
    });

    maximizeBtn.addEventListener("click", () => {
      if (!isMaximized) {
        // Save current position and size
        lastPosition = {
          left: win.style.left,
          top: win.style.top,
          width: win.style.width,
          height: win.style.height,
          resize: win.style.resize,
        };
        // Maximize
        win.style.left = "0";
        win.style.top = "38px"; // below topBar
        win.style.width = "100vw";
        win.style.height = `calc(100vh - 38px - 36px)`; // minus topBar & taskbar height
        win.style.resize = "none";
        isMaximized = true;
      } else {
        // Restore
        win.style.left = lastPosition.left;
        win.style.top = lastPosition.top;
        win.style.width = lastPosition.width;
        win.style.height = lastPosition.height;
        win.style.resize = lastPosition.resize;
        isMaximized = false;
      }
    });

    closeBtn.addEventListener("click", () => {
      win.style.display = "none";
      removeTaskbarButton(win.id);
    });

    // Bring window to front on click anywhere inside it
    win.addEventListener("mousedown", () => {
      bringToFront(win);
    });
  });

  // Drag functionality for windows by title bar
  windows.forEach(win => {
    const titleBar = win.querySelector(".title-bar");
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    titleBar.addEventListener("mousedown", e => {
      // Only allow drag with left mouse button
      if (e.button !== 0) return;

      isDragging = true;
      bringToFront(win);

      const rect = win.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;

      // Disable text selection while dragging
      document.body.style.userSelect = "none";
      document.body.style.cursor = "move";
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    });

    window.addEventListener("mousemove", e => {
      if (!isDragging) return;
      // Calculate new position
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;

      // Limit window inside viewport
      const maxLeft = window.innerWidth - win.offsetWidth;
      const maxTop = window.innerHeight - win.offsetHeight - taskbar.offsetHeight;

      if (newLeft < 0) newLeft = 0;
      if (newTop < 38) newTop = 38; // below top bar
      if (newLeft > maxLeft) newLeft = maxLeft;
      if (newTop > maxTop) newTop = maxTop;

      win.style.left = newLeft + "px";
      win.style.top = newTop + "px";
    });
  });

  // Initialize windows positions (optional)
  // Position them in a cascade style on first open (optional)

  // Live Clock Update
  function updateClock() {
    const clockElem = document.getElementById("clock");
    if (!clockElem) return;
    const now = new Date();
    const options = {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Kolkata",
    };
    const timeString = now.toLocaleTimeString("en-IN", options);
    clockElem.textContent = timeString + " IST";
  }

  updateClock();
  setInterval(updateClock, 1000);

});
  // Live Weather Update (using Open-Meteo API: free, no API key)
  async function updateWeather() {
    try {
      // Example: Bangalore coordinates (you can change lat/lon)
      const lat = 13.08;
      const lon = 77.58;

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,visibility`;
      const res = await fetch(url);
      const data = await res.json();

      const weather = data.current_weather;
      const humidity = data.hourly.relativehumidity_2m[0];
      const visibility = data.hourly.visibility[0] / 1000; // meters → km

      document.getElementById("temp").textContent = `${weather.temperature}°C`;
      document.getElementById("wind").textContent = `${weather.windspeed} km/h`;
      document.getElementById("humidity").textContent = `${humidity}% humid`;
      document.getElementById("forecast").textContent = `${weather.temperature - 2}° expected next hr`;
      document.getElementById("visibility").textContent = `${visibility} km visible`;
    } catch (err) {
      console.error("Weather fetch failed", err);
    }
  }

  updateWeather();
  setInterval(updateWeather, 60000); // refresh every 1 minute

