const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const video = document.createElement('video');
video.width = 640;
video.height = 480;
video.autoplay = true;

let outfit = new Image();
outfit.src = 'tshirt.png'; // default outfit

let outfitType = 'tshirt'; // default outfit type

let net;

function changeOutfit(filename, type) {
  outfit.src = filename;
  outfitType = type;
  console.log('Outfit changed to:', filename, 'type:', type);
}

async function setup() {
  net = await posenet.load();
  console.log('PoseNet loaded');

  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  video.onloadeddata = () => {
    console.log('Video loaded data');
    video.play();
    detectPose();
  };
}

async function detectPose() {
  const pose = await net.estimateSinglePose(video, { flipHorizontal: false });

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const leftShoulder = pose.keypoints.find(k => k.part === 'leftShoulder');
  const rightShoulder = pose.keypoints.find(k => k.part === 'rightShoulder');

  // Draw red debug circles on shoulders
  if (leftShoulder && leftShoulder.score > 0.5) {
    ctx.beginPath();
    ctx.arc(leftShoulder.position.x, leftShoulder.position.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  if (rightShoulder && rightShoulder.score > 0.5) {
    ctx.beginPath();
    ctx.arc(rightShoulder.position.x, rightShoulder.position.y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
  }

  if (
    leftShoulder && rightShoulder &&
    leftShoulder.score > 0.5 && rightShoulder.score > 0.5
  ) {
    const shoulderWidth = Math.abs(rightShoulder.position.x - leftShoulder.position.x);
    const centerX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
    const centerY = (leftShoulder.position.y + rightShoulder.position.y) / 2;

    let width, height, posX, posY;

    if (outfitType === 'dress') {
      // Dress: taller, positioned slightly lower
      width = shoulderWidth * 1.6;
      height = width * 2.0;

      posX = centerX - width / 2;
      posY = centerY - height * 0.05;
    } else {
      // T-shirt & Hoodie: square-ish, near shoulders
      width = shoulderWidth * 1.5;
      height = width;

      posX = centerX - width / 2;
      posY = centerY - height * 0.1;
    }

    ctx.drawImage(outfit, posX, posY, width, height);
  }

  requestAnimationFrame(detectPose);
}

outfit.onload = () => {
  console.log('Outfit image loaded');
  setup();
};
