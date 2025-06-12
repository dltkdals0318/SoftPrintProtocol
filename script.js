document.addEventListener('DOMContentLoaded', function() {
    const controlButtons = document.querySelectorAll('.control-btn');
    const controlButtonsContainer = document.getElementById('controlButtons');
    const mediaContainers = document.querySelectorAll('.media-container');
    const downloadBtn = document.getElementById('downloadBtn');
    const printingSound = document.getElementById('printingSound');
    const backgroundImage = document.getElementById('backgroundImage');
    let currentActive = null;
    let soundTimer = null;
    let animationTimer = null;
    let isAnimating = false;
    let audioInitialized = false;

    // 애니메이션 시간 설정 (밀리초)
    const ANIMATION_DURATION = 5500; // 5.5초 (가장 긴 애니메이션 시간)

    // 오디오 초기화 함수 (사용자 첫 상호작용 시)
    function initializeAudio() {
        if (!audioInitialized) {
            // 오디오 미리 로드 및 초기화
            printingSound.load();
            printingSound.volume = 0.5; // 볼륨 조절
            audioInitialized = true;
            console.log('오디오 초기화 완료');
        }
    }

    // 버튼들 비활성화/활성화 함수
    function disableControls() {
        isAnimating = true;
        controlButtonsContainer.classList.add('disabled');
        downloadBtn.classList.add('disabled');
        controlButtons.forEach(btn => {
            btn.classList.add('disabled');
        });
        console.log('disableControls 호출됨 - isAnimating:', isAnimating);
    }

    function enableControls() {
        isAnimating = false;
        controlButtonsContainer.classList.remove('disabled');
        downloadBtn.classList.remove('disabled');
        controlButtons.forEach(btn => {
            btn.classList.remove('disabled');
        });
        console.log('enableControls 호출됨 - isAnimating:', isAnimating);
    }

    // 버튼 클릭 이벤트
    controlButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 첫 번째 클릭 시 오디오 초기화
            initializeAudio();
            
            // 애니메이션 중이면 클릭 무시
            if (isAnimating) {
                console.log('애니메이션 진행 중 - 클릭 무시');
                return;
            }

            const targetId = this.getAttribute('data-target');
            const targetContainer = document.getElementById(targetId);
            
            // 현재 활성화된 미디어가 같은 것이면 숨기기
            if (currentActive === targetId) {
                hideAllMedia(false); // 애니메이션 없이 숨기기
                return;
            }
            
            // 컨트롤 비활성화
            disableControls();
            console.log('컨트롤 비활성화 - 애니메이션 시작');
            
            // 모든 미디어 숨기기 (애니메이션 중이므로 컨트롤 활성화하지 않음)
            hideAllMedia(true);
            
            // 배경 이미지 애니메이션 리셋 후 실행
            if (backgroundImage) {
                // 기존 클래스 제거
                backgroundImage.classList.remove('slide-away');
                
                // 약간의 지연 후 클래스 추가 (애니메이션 리셋을 위해)
                setTimeout(() => {
                    backgroundImage.classList.add('slide-away');
                }, 10);
            }
            
            // 선택된 미디어 보이기 (위에서 슬라이드인)
            if (targetContainer) {
                targetContainer.classList.add('active');
                this.classList.add('active');
                downloadBtn.classList.add('show');
                currentActive = targetId;
                
                // 프린팅 사운드 재생
                playPrintingSound();
                
                // 비디오인 경우 자동 재생 시작
                const video = targetContainer.querySelector('video');
                if (video) {
                    video.currentTime = 0; // 처음부터 재생
                    // 모바일에서 인라인 재생 보장
                    video.setAttribute('playsinline', 'true');
                    video.setAttribute('webkit-playsinline', 'true');
                    video.play().catch(e => {
                        console.log('자동재생이 차단되었습니다:', e);
                    });
                }

                // 애니메이션 완료 후 컨트롤 다시 활성화
                animationTimer = setTimeout(() => {
                    enableControls();
                    stopPrintingSound();
                    console.log('애니메이션 완료 - 컨트롤 활성화');
                }, ANIMATION_DURATION);
            }
        });
    });

    // 다운로드 버튼 클릭 이벤트
    downloadBtn.addEventListener('click', function() {
        // 첫 번째 클릭 시 오디오 초기화
        initializeAudio();
        
        // 애니메이션 중이거나 비활성화 상태면 클릭 무시
        if (isAnimating || this.classList.contains('disabled')) {
            console.log('다운로드 버튼 클릭 무시 - isAnimating:', isAnimating, 'disabled:', this.classList.contains('disabled'));
            return;
        }
        
        if (currentActive) {
            console.log('다운로드 시작:', currentActive);
            downloadCurrentMedia();
        }
    });

    // 프린팅 사운드 재생 함수
    function playPrintingSound() {
        if (!audioInitialized) {
            console.log('오디오가 초기화되지 않음');
            return;
        }
        
        // 기존 타이머가 있다면 제거
        if (soundTimer) {
            clearTimeout(soundTimer);
        }
        
        // 사운드를 처음부터 재생 (loop 설정으로 계속 반복)
        printingSound.currentTime = 0;
        const playPromise = printingSound.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('오디오 재생 시작');
            }).catch(e => {
                console.log('오디오 재생이 차단되었습니다:', e);
            });
        }
    }
    
    // 프린팅 사운드 정지 함수
    function stopPrintingSound() {
        printingSound.pause();
        printingSound.currentTime = 0; // 사운드 리셋
        if (soundTimer) {
            clearTimeout(soundTimer);
            soundTimer = null;
        }
    }

    // 현재 미디어 다운로드 함수
    function downloadCurrentMedia() {
        const activeContainer = document.getElementById(currentActive);
        if (!activeContainer) return;

        const video = activeContainer.querySelector('video');
        const img = activeContainer.querySelector('.media-img');
        
        let fileUrl = '';
        let fileName = '';

        if (video) {
            fileUrl = video.querySelector('source').src;
            fileName = currentActive + '.mp4';
        } else if (img) {
            fileUrl = img.src;
            fileName = currentActive + '.jpg';
        }

        if (fileUrl) {
            const link = document.createElement('a');
            link.href = fileUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 모든 미디어 숨기기 함수
    function hideAllMedia(duringAnimation = false) {
        // 프린팅 사운드 정지
        stopPrintingSound();
        
        // 애니메이션 중이 아닐 때만 타이머 클리어
        if (!duringAnimation && animationTimer) {
            clearTimeout(animationTimer);
            animationTimer = null;
        }
        
        mediaContainers.forEach(container => {
            container.classList.remove('active');
            // 비디오 일시정지
            const video = container.querySelector('video');
            if (video) {
                video.pause();
            }
        });
        
        controlButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        downloadBtn.classList.remove('show');
        currentActive = null;
        
        // 애니메이션 중이 아닐 때만 컨트롤 다시 활성화
        if (!duringAnimation) {
            enableControls();
            console.log('컨트롤 활성화 - 일반적인 숨기기');
        } else {
            console.log('애니메이션 중 - 컨트롤 유지 비활성화');
        }
    }

    // 배경 이미지 리셋 함수
    function resetBackgroundImage() {
        if (backgroundImage) {
            backgroundImage.classList.remove('slide-away');
        }
    }

    // ESC 키로 숨기기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && currentActive) {
            hideAllMedia(false); // 일반적인 숨기기
            resetBackgroundImage();
        }
    });

    // 페이지 로드 시 오디오 컨텍스트를 위한 사용자 상호작용 리스너
    document.addEventListener('click', initializeAudio, { once: true });
    document.addEventListener('touchstart', initializeAudio, { once: true });
});