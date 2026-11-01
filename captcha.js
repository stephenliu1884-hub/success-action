// 图片验证码。答案在前端，只能挡一挡随手乱试，并不增加真正的安全性（安全性靠访问密码）。

const rand = (min, max) => min + Math.random() * (max - min);

// 在 canvas 上画一组随机数字，返回正确答案。
export function drawCaptcha(canvas, length = 4) {
  const code = Array.from(crypto.getRandomValues(new Uint8Array(length)), (b) => b % 10).join("");
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;

  ctx.fillStyle = "#eef1f4";
  ctx.fillRect(0, 0, width, height);

  // 干扰线
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `hsl(${rand(0, 360)}, 50%, 60%)`;
    ctx.lineWidth = rand(1, 2);
    ctx.beginPath();
    ctx.moveTo(rand(0, width), rand(0, height));
    ctx.lineTo(rand(0, width), rand(0, height));
    ctx.stroke();
  }

  // 数字：每个随机旋转、上下偏移、换颜色
  ctx.font = "bold 26px Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const step = width / (length + 1);
  [...code].forEach((digit, i) => {
    ctx.save();
    ctx.translate(step * (i + 1), height / 2 + rand(-5, 5));
    ctx.rotate(rand(-0.4, 0.4));
    ctx.fillStyle = `hsl(${rand(0, 360)}, 60%, 35%)`;
    ctx.fillText(digit, 0, 0);
    ctx.restore();
  });

  // 干扰点
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `hsl(${rand(0, 360)}, 50%, 50%)`;
    ctx.fillRect(rand(0, width), rand(0, height), 1.5, 1.5);
  }

  return code;
}
