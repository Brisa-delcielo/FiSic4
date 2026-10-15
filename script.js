const canvas = document.getElementById('engineCanvas');
const ctx = canvas.getContext('2d');

let rpm = 800;
let targetRpm = 800;
let angle = 0;

let velocidadActualMs = 0;
let velocidadObjMs = 0;
let potenciaMotor = 350;
let masaVehiculoKg = 1100;

// Dimensiones mecánicas del motor
const crankRadius = 30;
const rodLength = 100;
const pistonWidth = 60;
const pistonHeight = 40;

let centerX = 130;
let crankshaftY = 220;

function ajustarResolucionCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const anchoVisual = 260;
    const altoVisual = 280;

    canvas.width = anchoVisual * dpr;
    canvas.height = altoVisual * dpr;

    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    canvas.style.width = `${anchoVisual}px`;
    canvas.style.height = `${altoVisual}px`;

    centerX = anchoVisual / 2;
    crankshaftY = 220;
}

window.addEventListener('load', () => {
    ajustarResolucionCanvas();
    iniciarSimulacion();
    animate();
});

window.addEventListener('resize', ajustarResolucionCanvas);

function animate() {
    const anchoVisual = canvas.width / (window.devicePixelRatio || 1);
    const altoVisual = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, anchoVisual, altoVisual);

    // Física de movimiento aplicada en tiempo real
    if (potenciaMotor > 0 && masaVehiculoKg > 0) {
        const rho = 1.225;
        const cx = 0.32;
        const area = 2.2;
        const fuerzaAero = 0.5 * rho * cx * area * Math.pow(velocidadActualMs, 2);

        const potenciaWatts = potenciaMotor * 745.7;
        let fuerzaTraccion = velocidadActualMs > 1 ? (potenciaWatts / velocidadActualMs) : (potenciaWatts / 1);
        const fuerzaAdherenciaMax = 0.8 * masaVehiculoKg * 9.81;
        fuerzaTraccion = Math.min(fuerzaTraccion, fuerzaAdherenciaMax);

        const fuerzaNeta = fuerzaTraccion - fuerzaAero;
        const aceleracion = fuerzaNeta / masaVehiculoKg;

        if (velocidadActualMs < velocidadObjMs) {
            velocidadActualMs += aceleracion * 0.016;
            if (velocidadActualMs > velocidadObjMs) velocidadActualMs = velocidadObjMs;
        } else if (velocidadActualMs > velocidadObjMs) {
            velocidadActualMs -= 4.0 * 0.016;
            if (velocidadActualMs < velocidadObjMs) velocidadActualMs = velocidadObjMs;
        }

        let rpmCalculadas = 800 + (velocidadActualMs / (250 / 3.6)) * 6200;
        targetRpm = Math.min(Math.max(rpmCalculadas, 800), 7500);
    } else {
        targetRpm = 800;
        velocidadActualMs = 0;
    }

    rpm += (targetRpm - rpm) * 0.08;

    if (rpm > 1) {
        const speed = (rpm / 60) * (Math.PI * 2) / 60;
        angle += speed;
    }

    // Cinemática del pistón
    const crankX = centerX + Math.sin(angle) * crankRadius;
    const crankY = crankshaftY - Math.cos(angle) * crankRadius;
    const deltaX = crankX - centerX;
    const pistonY = crankY - Math.sqrt(Math.max(0, Math.pow(rodLength, 2) - Math.pow(deltaX, 2)));

    // Estilo de dibujo formal / cuaderno (tinta azul oscura)
    ctx.strokeStyle = '#1a4b84';
    ctx.fillStyle = '#1a4b84';

    // 1. Cilindro
    ctx.lineWidth = 1.5;
    ctx.strokeRect(centerX - pistonWidth/2 - 5, 30, pistonWidth + 10, 160);

    // 2. Pistón
    ctx.fillRect(centerX - pistonWidth/2, pistonY - pistonHeight, pistonWidth, pistonHeight);

    // 3. Biela
    ctx.beginPath();
    ctx.moveTo(centerX, pistonY);
    ctx.lineTo(crankX, crankY);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Cigüeñal
    ctx.beginPath();
    ctx.arc(centerX, crankshaftY, crankRadius, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(crankX, crankY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Actualizar texto superior
    document.getElementById('rpmDisplay').innerHTML = `${Math.round(rpm).toLocaleString()} RPM`;

    requestAnimationFrame(animate);
}

// LÓGICA DE CÁLCULO Y FORMULAS
function iniciarSimulacion() {
    let potencia = parseFloat(document.getElementById('potencia').value) || 0;
    let masaKg = parseFloat(document.getElementById('peso').value) || 0;
    let velocidadKmh = parseFloat(document.getElementById('velocidad').value) || 0;

    if (potencia <= 0 || masaKg <= 0 || velocidadKmh <= 0) {
        potenciaMotor = 0;
        masaVehiculoKg = 0;
        velocidadObjMs = 0;
        document.getElementById('resPesoPotencia').innerText = `0.00 kg/HP`;
        document.getElementById('resFrenado').innerText = `0.0 m`;
        document.getElementById('resAero').innerText = `0.0 N`;
        document.getElementById('statusDisplay').innerText = "STANDBY";
        return;
    }

    potenciaMotor = potencia;
    masaVehiculoKg = masaKg;
    velocidadObjMs = velocidadKmh / 3.6;

    // 1. Relación Peso / Potencia ($m / P$)
    const relacion = (masaKg / potencia).toFixed(2);
    document.getElementById('resPesoPotencia').innerText = `${relacion} kg/HP`;

    // 2. Distancia de Frenado Estático ($v^2 / (2 \cdot \mu \cdot g)$)
    const frenado = (Math.pow(velocidadObjMs, 2) / (2 * 0.8 * 9.81)).toFixed(1);
    document.getElementById('resFrenado').innerText = `${frenado} m`;

    // 3. Resistencia Aerodinámica ($0.5 \cdot \rho \cdot C_x \cdot A \cdot v^2$)
    const aero = (0.5 * 1.225 * 0.32 * 2.2 * Math.pow(velocidadObjMs, 2)).toFixed(1);
    document.getElementById('resAero').innerText = `${aero} N`;

    // Estado de rendimiento en el cuaderno
    const statusDisplay = document.getElementById('statusDisplay');
    if (relacion < 3.0) {
        statusDisplay.innerText = "NIVEL: HIPERDEPORTIVO";
    } else if (relacion < 6.0) {
        statusDisplay.innerText = "NIVEL: ALTO RENDIMIENTO";
    } else {
        statusDisplay.innerText = "NIVEL: CALLE / ESTÁNDAR";
    }
}
