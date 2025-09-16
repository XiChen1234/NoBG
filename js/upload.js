/**
 * 图片上传功能模块
 * 处理文件选择、拖放上传和图片预览
 */
document.addEventListener('DOMContentLoaded', function () {
    // 获取DOM元素
    const imageUpload = document.getElementById('image-upload'); // 文件选择按钮
    const uploadArea = document.getElementById('upload-area'); // 拖放区域
    // 按钮
    const removeBtn = document.getElementById('remove-btn');
    const downloadBtn = document.getElementById('download-btn');
    const resetBtn = document.getElementById('reset-btn');


    /**
     * 处理文件选择
     * @param {File} file - 用户选择的文件
     */
    function handleFileSelect(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            // 将选择的图片显示在页面上
            const image = document.getElementById('original-image');
            image.src = e.target.result;
            image.style.display = 'block';

            // 启用按钮
            removeBtn.disabled = false;
            downloadBtn.disabled = false;
            resetBtn.disabled = false;
        }

        reader.readAsDataURL(file);
    }

    // 文件选择事件
    imageUpload.addEventListener('change', function (e) {
        if (this.files && this.files[0]) {
            handleFileSelect(this.files[0]);
        }
    });

    // 拖放功能实现
    uploadArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        console.log('dragover')
    });
    uploadArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        console.log('dragleave')
    });
    // 核心代码
    uploadArea.addEventListener('drop', function (e) {
        e.preventDefault();

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            // 将拖放的文件赋值给文件输入框
            imageUpload.files = e.dataTransfer.files;
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

})
