const canvas = document.getElementById('engineCanvas');
const ctx = canvas.getContext('2d');

let rpm = 0;
let targetRpm = 0;
let angle = 0;

// Dimensiones mecánicas del motor
const crankRadius = 35;
const rodLength = 120;
const pistonWidth = 70;
const pistonHeight = 50;

// Centrado dinámico
let centerX = 150;
let crankshaftY = 280;

function ajustarResolucionCanvas() {
    const dpr = window.devicePixelRatio || 1;
    
    const wrapper = canvas.parentElement;
    const paddingHorizontal = 32;
    const anchoVisual = Math.max(wrapper.clientWidth - paddingHorizontal, 200);
    const altoVisual = 380;

    canvas.width = anchoVisual * dpr;
    canvas.height = altoVisual * dpr;

    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    canvas.style.width = `${anchoVisual}px`;
    canvas.style.height = `${altoVisual}px`;

    centerX = anchoVisual / 2;
    crankshaftY = 280;
}

window.addEventListener('load', ajustarResolucionCanvas);
window.addEventListener('resize', ajustarResolucionCanvas);

function animate() {
    const anchoVisual = canvas.width / (window.devicePixelRatio || 1);
    const altoVisual = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, anchoVisual, altoVisual);

    // Suavizado dinámico de aceleración y desaceleración
    rpm += (targetRpm - rpm) * 0.05;

    if (rpm > 1) {
        const speed = (rpm / 60) * (Math.PI * 2) / 60;
        angle += speed;
    }

    // Cinemática de pistón y biela libre de errores NaN
    const crankX = centerX + Math.sin(angle) * crankRadius;
    const crankY = crankshaftY - Math.cos(angle) * crankRadius;
    
    const deltaX = crankX - centerX;
    const pistonY = crankY - Math.sqrt(Math.max(0, Math.pow(rodLength, 2) - Math.pow(deltaX, 2)));

    // 1. Cilindro
    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - pistonWidth/2 - 5, 40, pistonWidth + 10, 180);

    // 2. Pistón
    ctx.fillStyle = '#0a0a0a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.fillRect(centerX - pistonWidth/2, pistonY - pistonHeight, pistonWidth, pistonHeight);
    ctx.strokeRect(centerX - pistonWidth/2, pistonY - pistonHeight, pistonWidth, pistonHeight);

    ctx.fillStyle = '#888888';
    ctx.fillRect(centerX - 10, pistonY - pistonHeight + 20, 20, 2);

    // 3. Biela
    ctx.beginPath();
    ctx.moveTo(centerX, pistonY);
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

    // Mostrar RPMs sin límite visual
    document.getElementById('rpmDisplay').innerHTML = `${Math.round(rpm).toLocaleString()} <small style="color:#888">RPM</small>`;

    requestAnimationFrame(animate);
}

ajustarResolucionCanvas();
animate();

// LÓGICA DE SIMULACIÓN SIN LÍMITES DE UNIDADES
function iniciarSimulacion() {
    let potencia = parseFloat(document.getElementById('potencia').value) || 0;
    let masaInput = parseFloat(document.getElementById('peso').value) || 0;
    let velocidad = parseFloat(document.getElementById('velocidad').value) || 0;

    // Si los valores son cero o negativos, se apaga la animación
    if (potencia <= 0 || masaInput <= 0 || velocidad <= 0) {
        targetRpm = 0;
        document.getElementById('resPesoPotencia').innerHTML = `0.00 <small style="color:#888">kg/HP</small>`;
        document.getElementById('resFrenado').innerHTML = `0.0 <small style="color:#888">m</small>`;
        
        const statusDisplay = document.getElementById('statusDisplay');
        statusDisplay.innerText = "STANDBY";
        statusDisplay.style.color = "#888888";
        return;
    }

    // DETECCIÓN Y CONVERSIÓN DE UNIDADES (Toneladas vs Kilogramos)
    // Si el valor ingresado es menor o igual a 100, se asume Toneladas y se convierte a KG
    let masaKg = masaInput <= 100 ? masaInput * 1000 : masaInput;
    let unidadTexto = masaInput <= 100 ? "T/HP" : "kg/HP";

    // Cálculos físicos
    const relacion = (masaKg / potencia).toFixed(2);
    const velocidadMs = velocidad / 3.6;
    const frenado = (Math.pow(velocidadMs, 2) / (2 * 0.7 * 9.81)).toFixed(1);

    // Ajuste dinámico de RPM sin topes rígidos
    targetRpm = potencia * 12;

    // Formateo de resultados para la interfaz
    document.getElementById('resPesoPotencia').innerHTML = `${relacion} <small style="color:#888">${unidadTexto}</small>`;
    document.getElementById('resFrenado').innerHTML = `${Number(frenado).toLocaleString()} <small style="color:#888">m</small>`;

    // Indicador de estado dinámico escalable
    const statusDisplay = document.getElementById('statusDisplay');
    if (targetRpm > 10000) {
        statusDisplay.innerText = "HYPERDRIVE";
        statusDisplay.style.color = "#ff0055";
    } else if (targetRpm > 7000) {
        statusDisplay.innerText = "OVERLOAD";
        statusDisplay.style.color = "#ff4444";
    } else if (targetRpm > 4000) {
        statusDisplay.innerText = "HIGH POWER";
        statusDisplay.style.color = "#ffbb00";
    } else {
        statusDisplay.innerText = "OPTIMAL";
        statusDisplay.style.color = "#ffffff";
    }
}

// RESETEO COMPLETO
function resetearSimulacion() {
    targetRpm = 0;
    
    document.getElementById('potencia').value = '';
    document.getElementById('peso').value = '';
    document.getElementById('velocidad').value = '';

    document.getElementById('resPesoPotencia').innerHTML = `0.00 <small style="color:#888">kg/HP</small>`;
    document.getElementById('resFrenado').innerHTML = `0.0 <small style="color:#888">m</small>`;

    const statusDisplay = document.getElementById('statusDisplay');
    statusDisplay.innerText = "STANDBY";
    statusDisplay.style.color = "#888888";
}