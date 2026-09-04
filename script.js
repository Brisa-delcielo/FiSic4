const canvas = document.getElementById('engineCanvas');
const ctx = canvas.getContext('2d');

let rpm = 0;
let targetRpm = 0;
let angle = 0;

// Dimensiones mecánicas fijas
const crankRadius = 35;
const rodLength = 120;
const pistonWidth = 70;
const pistonHeight = 50;

// Variables dinámicas adaptables al contenedor
let centerX = 150;
let crankshaftY = 280;

// Configuración de alta definición (Retina/HiDPI)
function ajustarResolucionCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Establece el número real de píxeles internos (HD)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Escala todo el contexto gráfico según la densidad del teléfono
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    // Fija la dimensión visual en pantalla
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Recalcula el centro horizontal en vivo
    centerX = rect.width / 2;
    crankshaftY = 280;
}

// Escuchar eventos de redimensionado
window.addEventListener('load', ajustarResolucionCanvas);
window.addEventListener('resize', ajustarResolucionCanvas);

function animate() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Suavizado de aceleración de RPM
    rpm += (targetRpm - rpm) * 0.1;

    if (rpm > 10) {
        const speed = (rpm / 60) * (Math.PI * 2) / 60;
        angle += speed;
    }

    const crankX = centerX + Math.cos(angle) * crankRadius;
    const crankY = crankshaftY + Math.sin(angle) * crankRadius;
    const pistonY = crankY - Math.sqrt(Math.pow(rodLength, 2) - Math.pow(crankX - centerX, 2));

    // 1. Cilindro (Guías)
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - pistonWidth/2 - 5, 40, pistonWidth + 10, 180);

    // 2. Pistón
    ctx.fillStyle = '#0a0a0a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fillRect(centerX - pistonWidth/2, pistonY - pistonHeight, pistonWidth, pistonHeight);
    ctx.strokeRect(centerX - pistonWidth/2, pistonY - pistonHeight, pistonWidth, pistonHeight);

    // Detalle central del pistón
    ctx.fillStyle = '#888888';
    ctx.fillRect(centerX - 10, pistonY - pistonHeight + 20, 20, 2);

    // 3. Biela
    ctx.beginPath();
    ctx.moveTo(centerX, pistonY - 10);
    ctx.lineTo(crankX, crankY);
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Cigüeñal
    ctx.beginPath();
    ctx.arc(centerX, crankshaftY, crankRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(crankX, crankY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    requestAnimationFrame(animate);
}

// Inicialización de la simulación
ajustarResolucionCanvas();
animate();

function iniciarSimulacion() {
    const potencia = parseFloat(document.getElementById('potencia').value);
    const peso = parseFloat(document.getElementById('peso').value);
    const velocidad = parseFloat(document.getElementById('velocidad').value);

    if (!potencia || !peso || !velocidad) return;

    const relacion = (peso / potencia).toFixed(2);
    const velocidadMs = velocidad / 3.6;
    const frenado = (Math.pow(velocidadMs, 2) / (2 * 0.7 * 9.81)).toFixed(1);

    targetRpm = Math.min(potencia * 12, 8500);

    document.getElementById('resPesoPotencia').innerHTML = `${relacion} <small style="color:#888">kg/HP</small>`;
    document.getElementById('resFrenado').innerHTML = `${frenado} <small style="color:#888">m</small>`;
    document.getElementById('rpmDisplay').innerHTML = `${Math.round(targetRpm)} <small style="color:#888">RPM</small>`;

    const statusDisplay = document.getElementById('statusDisplay');
    statusDisplay.innerText = "RUNNING";
    statusDisplay.style.color = "#ffffff";
}