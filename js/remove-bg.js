/**
 * 背景去除功能模块
 * 使用TensorFlow.js和BodyPix模型实现图片背景去除
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function () {
    const removeBtn = document.getElementById('remove-btn');
    const downloadBtn = document.getElementById('download-btn');

    const originalImage = document.getElementById('original-image');
    const processedImage = document.getElementById('processed-image');
    
    // 进度条相关元素
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    let net = null;

    /**
     * 更新进度条
     * @param {number} percentage - 进度百分比 (0-100)
     * @param {string} text - 进度文本
     */
    function updateProgress(percentage, text) {
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = text;
    }

    /**
     * 加载BodyPix模型
     * @returns {Promise} 模型加载完成后的Promise
     */
    async function loadModel() {
        console.log("loadModel")
        try {

            net = await bodyPix.load({
                architecture: 'MobileNetV1',
                outputStride: 16,
                multiplier: 1.0,  // 提高模型质量
                quantBytes: 4     // 使用更多位量化以提高质量
            });

            return net;
        } catch (error) {
            console.log('加载模型失败：', error);
            alert('加载模型失败，请刷新页面重试');
            throw error;
        }
    }

    /**
 * 应用高斯模糊到画布
 * @param {HTMLCanvasElement} canvas - 要模糊的画布
 * @param {number} strength - 模糊强度
 */
    function applyGaussianBlur(canvas, strength) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // 创建临时画布用于模糊处理
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // 先水平模糊
        tempCtx.putImageData(imageData, 0, 0);

        // 应用CSS模糊滤镜
        tempCtx.filter = `blur(${strength}px)`;
        tempCtx.drawImage(canvas, 0, 0);

        // 将结果绘制回原画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempCanvas, 0, 0);
    }


    /**
     * 图片处理流程
     */
    async function processImage() {
        removeBtn.disabled = true;
        removeBtn.textContent = '加载中...';
        progressContainer.style.display = 'block';
        updateProgress(0, '准备处理...');

        if (!originalImage.src) {
            alert('请先上传图片');
            progressContainer.style.display = 'none';
            return;
        }

        try {
            // 步骤1: 检查并加载模型 (20%)
            if (!net) {
                updateProgress(10, '加载模型中...');
                net = await loadModel();
                updateProgress(20, '模型加载完成');
            } else {
                updateProgress(20, '准备图像...');
            }

            // 步骤2: 创建并准备画布 (30%)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = originalImage.naturalWidth;
            canvas.height = originalImage.naturalHeight;

            ctx.drawImage(originalImage, 0, 0);
            updateProgress(30, '图像准备完成');

            // 步骤3: 进行人体分割 (60%)
            updateProgress(40, '正在进行人物识别...');
            const segmentation = await net.segmentPerson(canvas, {
                flipHorizontal: false,
                internalResolution: 0.4,  // 提高内部分辨率以获得更精细的结果
                segmentationThreshold: 0.8,  // 设置分割阈值
                scoreThreshold: 0.8,         // 设置人物检测阈值
            })
            updateProgress(60, '人物识别完成');

            // 步骤4: 创建掩码并应用高斯模糊 (80%)
            updateProgress(70, '创建背景掩码...');
            const maskCanvas = document.createElement('canvas');
            const maskCtx = maskCanvas.getContext('2d');

            maskCanvas.width = canvas.width;
            maskCanvas.height = canvas.height;

            const foregroundImageData = bodyPix.toMask(segmentation,
                { r: 255, g: 255, b: 255, a: 255 }, // 人物：白色不透明
                { r: 0, g: 0, b: 0, a: 0 }          // 背景：黑色透明
            );
            maskCtx.putImageData(foregroundImageData, 0, 0);

            applyGaussianBlur(maskCanvas, 3); // 应用高斯模糊
            updateProgress(80, '背景掩码处理完成');

            // 步骤5: 创建结果图像并应用掩码 (95%)
            updateProgress(85, '正在合成结果图像...');
            const resultCanvas = document.createElement('canvas');
            resultCanvas.width = canvas.width; // 和原图尺寸一致
            resultCanvas.height = canvas.height;
            const resultCtx = resultCanvas.getContext('2d');

            // 第一步：把原始画布的内容（即原图）画到结果画布上
            resultCtx.drawImage(canvas, 0, 0);

            // 第二步：应用掩码（关键操作！）
            // 用「destination-in」合成模式：只保留两张图重叠的不透明区域
            resultCtx.globalCompositeOperation = 'destination-in';
            resultCtx.drawImage(maskCanvas, 0, 0);

            // 恢复默认合成模式（避免影响后续绘图）
            resultCtx.globalCompositeOperation = 'source-over';

            updateProgress(95, '处理完成，正在生成最终图像...');
            processedImage.src = resultCanvas.toDataURL('image/png');
            processedImage.style.display = 'block';
            downloadBtn.disabled = false;
        } catch (error) {
            console.log('处理图片失败：', error);
            alert('处理图片失败，请刷新页面重试');
            progressContainer.style.display = 'none';
        } finally {
            updateProgress(100, '处理完成！');
            // 短暂显示100%完成状态，然后隐藏进度条
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 3000);
            removeBtn.textContent = '去除背景';
            removeBtn.disabled = false;
        }
    }

    // 绑定去除背景按钮事件
    removeBtn.addEventListener('click', processImage);
});