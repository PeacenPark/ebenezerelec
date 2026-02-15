console.log('=== app-compat.js 로드 시작 ===');

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDC6FhxOz3SmBO83Y0aO3X4kTLFtKIZb6g",
    authDomain: "ebenezerelec-5b7f0.firebaseapp.com",
    projectId: "ebenezerelec-5b7f0",
    storageBucket: "ebenezerelec-5b7f0.firebasestorage.app",
    messagingSenderId: "704102812166",
    appId: "1:704102812166:web:ce23aa79452aed6f211187",
    measurementId: "G-LET938M2E0"
};

// Firebase 초기화
console.log('Firebase 초기화 중...');
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log('Firebase 초기화 완료');

// 전역 변수
let currentEditId = null;
let allTransactions = [];
let allSchedules = [];
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let selectedCalendarDate = null;
let currentScheduleDetailId = null;

// ========================================
// DOM이 로드된 후 실행
// ========================================
console.log('DOMContentLoaded 리스너 등록 중...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM 로드 완료 ===');
    
    // DOM 요소
    const form = document.getElementById('transactionForm');
    const phoneInput = document.getElementById('phone');
    const totalCostInput = document.getElementById('totalCost');
    const materialCostInput = document.getElementById('materialCost');
    const laborCostInput = document.getElementById('laborCost');
    const profitInput = document.getElementById('profit');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const referralSourceSelect = document.getElementById('referralSource');
    const referralDetailGroup = document.getElementById('referralDetailGroup');
    const referralDetailInput = document.getElementById('referralDetail');
    
    // 모달 요소
    const modal = document.getElementById('transactionModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    console.log('DOM 요소 확인:');
    console.log('- openModalBtn:', openModalBtn);
    console.log('- closeModalBtn:', closeModalBtn);
    console.log('- modal:', modal);
    console.log('- form:', form);
    
    // ========================================
    // 모달 관련 함수
    // ========================================
    function openModal() {
        console.log('>>> 모달 열기 함수 실행');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('모달 클래스 추가됨');
        } else {
            console.error('모달 요소를 찾을 수 없음');
        }
    }
    
    function closeModal() {
        console.log('>>> 모달 닫기 함수 실행');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            if (currentEditId) {
                currentEditId = null;
                document.getElementById('submitBtn').textContent = '✅ 거래 내역 저장';
                resetForm();
            }
        }
    }
    
    // 모달 버튼 이벤트
    console.log('모달 버튼 이벤트 리스너 등록 중...');
    
    if (openModalBtn) {
        console.log('openModalBtn 이벤트 리스너 등록');
        openModalBtn.addEventListener('click', function(e) {
            console.log('!!! 새 거래 등록 버튼 클릭됨 !!!');
            e.preventDefault();
            openModal();
        });
    } else {
        console.error('openModalBtn을 찾을 수 없습니다!');
    }
    
    if (closeModalBtn) {
        console.log('closeModalBtn 이벤트 리스너 등록');
        closeModalBtn.addEventListener('click', function(e) {
            console.log('!!! 닫기 버튼 클릭됨 !!!');
            e.preventDefault();
            closeModal();
        });
    } else {
        console.error('closeModalBtn을 찾을 수 없습니다!');
    }
    
    // 모달 외부 클릭 시 닫기
    window.onclick = function(event) {
        if (event.target === modal) {
            console.log('모달 외부 클릭');
            closeModal();
        }
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.classList.contains('show')) {
            console.log('ESC 키 눌림');
            closeModal();
        }
    });
    
    // ========================================
    // 유입 경로 관련
    // ========================================
    if (referralSourceSelect) {
        referralSourceSelect.addEventListener('change', function() {
            const value = this.value;
            if (value === '소개' || value === '기타') {
                referralDetailGroup.style.display = 'block';
                referralDetailInput.placeholder = value === '소개' ? '소개자 이름 입력' : '상세 정보 입력';
            } else {
                referralDetailGroup.style.display = 'none';
                referralDetailInput.value = '';
            }
        });
    }
    
    // ========================================
    // 작업 일정 토글
    // ========================================
    const addScheduleToggle = document.getElementById('addScheduleToggle');
    const scheduleFields = document.getElementById('scheduleFields');
    
    if (addScheduleToggle) {
        addScheduleToggle.addEventListener('change', function() {
            scheduleFields.style.display = this.checked ? 'block' : 'none';
            // 토글 켜면 작업일을 일정 날짜 기본값으로
            if (this.checked) {
                const dateVal = document.getElementById('date').value;
                const scheduleDateInput = document.getElementById('scheduleDate');
                if (dateVal && scheduleDateInput) {
                    scheduleDateInput.value = dateVal;
                }
            }
        });
    }

    // ========================================
    // 날짜 설정
    // ========================================
    function setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
    }
    
    // ========================================
    // 전화번호 자동 포맷팅
    // ========================================
    function formatPhoneNumber(value) {
        // 숫자만 추출
        const numbers = value.replace(/[^\d]/g, '');
        
        // 길이에 따라 포맷팅
        if (numbers.length <= 3) {
            return numbers;
        } else if (numbers.length <= 7) {
            return numbers.slice(0, 3) + '-' + numbers.slice(3);
        } else if (numbers.length <= 10) {
            return numbers.slice(0, 3) + '-' + numbers.slice(3, 6) + '-' + numbers.slice(6);
        } else {
            return numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11);
        }
    }
    
    // 전화번호 입력 이벤트
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const input = e.target;
            const oldValue = input.value;
            const oldCursorPosition = input.selectionStart;
            
            // 포맷팅
            const formatted = formatPhoneNumber(oldValue);
            
            // 값 설정
            input.value = formatted;
            
            // 커서 위치 계산
            // 이전 커서 위치까지의 숫자 개수 세기
            const numbersBeforeCursor = oldValue.slice(0, oldCursorPosition).replace(/[^\d]/g, '').length;
            
            // 새 문자열에서 같은 개수의 숫자가 있는 위치 찾기
            let newCursorPosition = 0;
            let numberCount = 0;
            
            for (let i = 0; i < formatted.length; i++) {
                if (formatted[i] >= '0' && formatted[i] <= '9') {
                    numberCount++;
                }
                if (numberCount >= numbersBeforeCursor) {
                    newCursorPosition = i + 1;
                    break;
                }
            }
            
            // 커서 위치 설정
            input.setSelectionRange(newCursorPosition, newCursorPosition);
        });
    }
    
    // ========================================
    // 비용 계산
    // ========================================
    function calculateCosts() {
        const total = parseInt(totalCostInput.value) || 0;
        const material = parseInt(materialCostInput.value) || 0;
        const labor = parseInt(laborCostInput.value) || 0;
        const profit = total - material - labor;
    
        profitInput.value = profit >= 0 ? profit : 0;
    }
    
    // ========================================
    // 폼 초기화
    // ========================================
    function resetForm() {
        form.reset();
        setDefaultDate();
        calculateCosts();
        referralDetailGroup.style.display = 'none';
        // 일정 필드 초기화
        const scheduleToggle = document.getElementById('addScheduleToggle');
        const scheduleFieldsEl = document.getElementById('scheduleFields');
        if (scheduleToggle) scheduleToggle.checked = false;
        if (scheduleFieldsEl) scheduleFieldsEl.style.display = 'none';
    }
    
    // ========================================
    // 폼 제출 처리
    // ========================================
    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('폼 제출');

        const scheduleToggle = document.getElementById('addScheduleToggle');
        const isScheduleOn = scheduleToggle && scheduleToggle.checked;

        // 일정 토글이 켜져 있으면 필수 필드 검증
        if (isScheduleOn) {
            const sDate = document.getElementById('scheduleDate').value;
            const sTime = document.getElementById('scheduleStartTime').value;
            if (!sDate || !sTime) {
                alert('⚠️ 작업 일정의 예정일과 시작 시간을 입력해주세요.');
                return;
            }
        }
    
        const transactionData = {
            customerName: document.getElementById('customerName').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('date').value,
            location: document.getElementById('location').value,
            detailedLocation: document.getElementById('detailedLocation').value,
            serviceType: document.getElementById('serviceType').value,
            referralSource: document.getElementById('referralSource').value,
            referralDetail: document.getElementById('referralDetail').value,
            content: document.getElementById('content').value,
            totalCost: parseInt(document.getElementById('totalCost').value) || 0,
            materialCost: parseInt(document.getElementById('materialCost').value) || 0,
            laborCost: parseInt(document.getElementById('laborCost').value) || 0,
            profit: parseInt(document.getElementById('profit').value) || 0,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };
    
        try {
            let transactionId;
            if (currentEditId) {
                await db.collection('transactions').doc(currentEditId).update(transactionData);
                transactionId = currentEditId;
                currentEditId = null;
                document.getElementById('submitBtn').textContent = '✅ 거래 내역 저장';
            } else {
                const docRef = await db.collection('transactions').add(transactionData);
                transactionId = docRef.id;
            }

            // 일정 동시 저장
            if (isScheduleOn && !currentEditId) {
                const scheduleData = {
                    customerName: transactionData.customerName,
                    phone: transactionData.phone,
                    location: transactionData.location,
                    detailedLocation: transactionData.detailedLocation,
                    serviceType: transactionData.serviceType,
                    workContent: transactionData.content,
                    date: document.getElementById('scheduleDate').value,
                    startTime: document.getElementById('scheduleStartTime').value,
                    endTime: document.getElementById('scheduleEndTime').value || '',
                    materials: document.getElementById('scheduleMaterials').value || '',
                    scheduleNotes: document.getElementById('scheduleNotes').value || '',
                    status: 'pending',
                    linkedTransactionId: transactionId,
                    timestamp: new Date().toISOString()
                };
                await db.collection('schedules').add(scheduleData);
                alert('✅ 거래 내역과 작업 일정이 함께 저장되었습니다!');
            } else {
                alert('✅ 거래 내역이 ' + (currentEditId ? '수정' : '저장') + '되었습니다!');
            }
    
            resetForm();
            closeModal();
        } catch (error) {
            console.error('Error:', error);
            alert('❌ 오류가 발생했습니다: ' + error.message);
        }
    }
    
    // ========================================
    // 거래 목록 불러오기
    // ========================================
    function loadTransactions() {
        console.log('거래 목록 불러오기 시작');
        
        db.collection('transactions')
            .orderBy('date', 'desc')
            .onSnapshot((snapshot) => {
                console.log('데이터 스냅샷 받음:', snapshot.size, '개');
                allTransactions = [];
                
                snapshot.forEach((doc) => {
                    allTransactions.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                
                displayTransactions(allTransactions);
                updateStatistics(allTransactions);
                generateMonthlyStats(allTransactions);
                generateLocationStats(allTransactions);
                generateServiceStats(allTransactions);
                generateReferralStats(allTransactions);
                populateMonthFilter();
            }, (error) => {
                console.error('데이터 로드 에러:', error);
            });
    }
    
    // ========================================
    // 거래 목록 표시
    // ========================================
    function displayTransactions(transactions) {
        const listElement = document.getElementById('transactionList');
    
        if (transactions.length === 0) {
            listElement.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>등록된 거래 내역이 없습니다</h3>
                    <p>위 버튼을 클릭하여 새로운 거래 내역을 입력해주세요</p>
                </div>
            `;
            return;
        }
    
        listElement.innerHTML = transactions.map(transaction => createTransactionHTML(transaction)).join('');
    }
    
    // ========================================
    // 거래 항목 HTML 생성 (간단한 카드)
    // ========================================
    function createTransactionHTML(transaction) {
        return `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-header">
                    <div class="customer-name">👤 ${transaction.customerName}</div>
                    <div class="transaction-date">📅 ${transaction.date}</div>
                </div>

                <div class="transaction-summary">
                    <div class="summary-item">
                        <span class="icon">📞</span>
                        ${transaction.phone}
                    </div>
                    <div class="summary-item">
                        <span class="icon">📍</span>
                        ${transaction.location}
                    </div>
                    <div class="summary-item">
                        <span class="icon">🔧</span>
                        ${transaction.serviceType}
                    </div>
                    <div class="summary-item">
                        <span class="icon">🔗</span>
                        ${transaction.referralSource || '미입력'}
                    </div>
                </div>

                <div class="transaction-amount">
                    <div>
                        <span class="amount-label">총 비용</span>
                        <div class="amount-value">₩${formatNumber(transaction.totalCost)}</div>
                    </div>
                    <div style="text-align: right;">
                        <span class="amount-label">순이익</span>
                        <div class="profit-value">₩${formatNumber(transaction.profit)}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ========================================
    // 숫자 포맷팅
    // ========================================
    function formatNumber(num) {
        return num.toLocaleString();
    }
    
    // ========================================
    // 통계 업데이트
    // ========================================
    function updateStatistics(transactions) {
        // 요약 통계 카드는 제거됨 - 필요 없음
        // 월별 통계는 별도로 generateMonthlyStats()에서 처리
    }
    
    // ========================================
    // 거래 수정
    // ========================================
    function editTransaction(id) {
        console.log('거래 수정:', id);
        const transaction = allTransactions.find(t => t.id === id);
        if (!transaction) return;
    
        currentEditId = id;
    
        document.getElementById('customerName').value = transaction.customerName;
        document.getElementById('phone').value = transaction.phone;
        document.getElementById('date').value = transaction.date;
        document.getElementById('location').value = transaction.location;
        document.getElementById('detailedLocation').value = transaction.detailedLocation || '';
        document.getElementById('serviceType').value = transaction.serviceType;
        document.getElementById('referralSource').value = transaction.referralSource || '';
        document.getElementById('referralDetail').value = transaction.referralDetail || '';
        document.getElementById('content').value = transaction.content;
        document.getElementById('totalCost').value = transaction.totalCost;
        document.getElementById('materialCost').value = transaction.materialCost;
        document.getElementById('laborCost').value = transaction.laborCost || 0;
        document.getElementById('notes').value = transaction.notes || '';
        
        // 유입 경로 상세 필드 표시 여부
        if (transaction.referralSource === '소개' || transaction.referralSource === '기타') {
            referralDetailGroup.style.display = 'block';
        }
    
        calculateCosts();
    
        document.getElementById('submitBtn').textContent = '✏️ 거래 내역 수정';
        openModal();
    }
    
    // ========================================
    // 거래 삭제
    // ========================================
    async function deleteTransaction(id) {
        console.log('거래 삭제:', id);
        if (!confirm('정말 이 거래 내역을 삭제하시겠습니까?')) return;
    
        try {
            await db.collection('transactions').doc(id).delete();
            alert('✅ 거래 내역이 삭제되었습니다!');
        } catch (error) {
            console.error('Error:', error);
            alert('❌ 삭제 중 오류가 발생했습니다: ' + error.message);
        }
    }
    
    // ========================================
    // 검색 처리
    // ========================================
    function handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = allTransactions.filter(t => 
            t.customerName.toLowerCase().includes(searchTerm) ||
            t.location.toLowerCase().includes(searchTerm) ||
            t.content.toLowerCase().includes(searchTerm) ||
            t.serviceType.toLowerCase().includes(searchTerm)
        );
        displayTransactions(filtered);
    }
    
    // ========================================
    // 월별 필터 관련
    // ========================================
    function populateMonthFilter() {
        const monthFilter = document.getElementById('monthFilter');
        if (!monthFilter) return;
        
        const months = new Set();
        allTransactions.forEach(t => {
            const month = t.date.substring(0, 7); // YYYY-MM
            months.add(month);
        });
        
        const sortedMonths = Array.from(months).sort().reverse();
        
        monthFilter.innerHTML = '<option value="">월별 조회</option>';
        sortedMonths.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = month;
            monthFilter.appendChild(option);
        });
    }
    
    // ========================================
    // 필터 처리
    // ========================================
    function handleFilter(e) {
        filterButtons.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        // 월별 선택 초기화
        const monthFilterEl = document.getElementById('monthFilter');
        if (monthFilterEl) monthFilterEl.value = '';
    
        const filter = e.target.dataset.filter;
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    
        let filtered = allTransactions;
    
        if (filter === 'today') {
            filtered = allTransactions.filter(t => t.date === today);
        } else if (filter === 'week') {
            filtered = allTransactions.filter(t => t.date >= weekAgo);
        } else if (filter === 'month') {
            filtered = allTransactions.filter(t => t.date >= monthStart);
        }
    
        displayTransactions(filtered);
        updateStatistics(filtered);
    }
    
    // ========================================
    // 월별 통계 생성
    // ========================================
    function generateMonthlyStats(transactions) {
        const monthlyData = {};
    
        transactions.forEach(t => {
            const month = t.date.substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    count: 0,
                    totalRevenue: 0,
                    materialCost: 0,
                    laborCost: 0,
                    profit: 0
                };
            }
    
            monthlyData[month].count++;
            monthlyData[month].totalRevenue += t.totalCost || 0;
            monthlyData[month].materialCost += t.materialCost || 0;
            monthlyData[month].laborCost += t.laborCost || 0;
            monthlyData[month].profit += t.profit || 0;
        });
    
        const sortedMonths = Object.keys(monthlyData).sort().reverse();
        const tbody = document.getElementById('monthlyStatsBody');
        
        if (sortedMonths.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="loading">데이터가 없습니다</td></tr>';
            return;
        }
    
        let totalCount = 0;
        let totalRevenue = 0;
        let totalMaterialCost = 0;
        let totalLaborCost = 0;
        let totalProfit = 0;
    
        tbody.innerHTML = sortedMonths.map(month => {
            const data = monthlyData[month];
            const avgPrice = Math.round(data.totalRevenue / data.count);
    
            totalCount += data.count;
            totalRevenue += data.totalRevenue;
            totalMaterialCost += data.materialCost;
            totalLaborCost += data.laborCost;
            totalProfit += data.profit;
    
            return `
                <tr>
                    <td><strong>${month}</strong></td>
                    <td class="number">${data.count}건</td>
                    <td class="number">₩${formatNumber(data.totalRevenue)}</td>
                    <td class="number">₩${formatNumber(data.materialCost)}</td>
                    <td class="number">₩${formatNumber(data.laborCost)}</td>
                    <td class="number">₩${formatNumber(data.profit)}</td>
                    <td class="number">₩${formatNumber(avgPrice)}</td>
                </tr>
            `;
        }).join('');
    
        const avgTotal = Math.round(totalRevenue / totalCount);
        tbody.innerHTML += `
            <tr class="total-row">
                <td><strong>합계</strong></td>
                <td class="number">${totalCount}건</td>
                <td class="number">₩${formatNumber(totalRevenue)}</td>
                <td class="number">₩${formatNumber(totalMaterialCost)}</td>
                <td class="number">₩${formatNumber(totalLaborCost)}</td>
                <td class="number">₩${formatNumber(totalProfit)}</td>
                <td class="number">₩${formatNumber(avgTotal)}</td>
            </tr>
        `;
        
        // 차트 생성
        createMonthlyChart(sortedMonths, monthlyData);
    }
    
    // ========================================
    // 지역별 통계 생성
    // ========================================
    function generateLocationStats(transactions) {
        const locationData = {};
        let totalRevenue = 0;
    
        transactions.forEach(t => {
            if (!locationData[t.location]) {
                locationData[t.location] = {
                    count: 0,
                    totalRevenue: 0
                };
            }
    
            locationData[t.location].count++;
            locationData[t.location].totalRevenue += t.totalCost || 0;
            totalRevenue += t.totalCost || 0;
        });
    
        const sortedLocations = Object.keys(locationData).sort((a, b) => 
            locationData[b].totalRevenue - locationData[a].totalRevenue
        );
    
        const tbody = document.getElementById('locationStatsBody');
        
        if (sortedLocations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">데이터가 없습니다</td></tr>';
            return;
        }
    
        tbody.innerHTML = sortedLocations.map(location => {
            const data = locationData[location];
            const avgPrice = Math.round(data.totalRevenue / data.count);
            const share = ((data.totalRevenue / totalRevenue) * 100).toFixed(1);
    
            return `
                <tr>
                    <td><strong>${location}</strong></td>
                    <td class="number">${data.count}건</td>
                    <td class="number">₩${formatNumber(data.totalRevenue)}</td>
                    <td class="number">₩${formatNumber(avgPrice)}</td>
                    <td class="number percentage">${share}%</td>
                </tr>
            `;
        }).join('');
    
        tbody.innerHTML += `
            <tr class="total-row">
                <td><strong>합계</strong></td>
                <td class="number">${transactions.length}건</td>
                <td class="number">₩${formatNumber(totalRevenue)}</td>
                <td class="number">-</td>
                <td class="number percentage">100.0%</td>
            </tr>
        `;
        
        // 차트 생성
        createLocationChart(sortedLocations, locationData);
    }
    
    // ========================================
    // 서비스별 통계 생성
    // ========================================
    function generateServiceStats(transactions) {
        const serviceData = {};
        let totalRevenue = 0;
    
        transactions.forEach(t => {
            if (!serviceData[t.serviceType]) {
                serviceData[t.serviceType] = {
                    count: 0,
                    totalRevenue: 0
                };
            }
    
            serviceData[t.serviceType].count++;
            serviceData[t.serviceType].totalRevenue += t.totalCost || 0;
            totalRevenue += t.totalCost || 0;
        });
    
        const sortedServices = Object.keys(serviceData).sort((a, b) => 
            serviceData[b].totalRevenue - serviceData[a].totalRevenue
        );
    
        const tbody = document.getElementById('serviceStatsBody');
        
        if (sortedServices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">데이터가 없습니다</td></tr>';
            return;
        }
    
        tbody.innerHTML = sortedServices.map(service => {
            const data = serviceData[service];
            const avgPrice = Math.round(data.totalRevenue / data.count);
            const share = ((data.totalRevenue / totalRevenue) * 100).toFixed(1);
    
            return `
                <tr>
                    <td><strong>${service}</strong></td>
                    <td class="number">${data.count}건</td>
                    <td class="number">₩${formatNumber(data.totalRevenue)}</td>
                    <td class="number">₩${formatNumber(avgPrice)}</td>
                    <td class="number percentage">${share}%</td>
                </tr>
            `;
        }).join('');
    
        tbody.innerHTML += `
            <tr class="total-row">
                <td><strong>합계</strong></td>
                <td class="number">${transactions.length}건</td>
                <td class="number">₩${formatNumber(totalRevenue)}</td>
                <td class="number">-</td>
                <td class="number percentage">100.0%</td>
            </tr>
        `;
        
        // 차트 생성
        createServiceChart(sortedServices, serviceData);
    }
    
    // ========================================
    // 유입 경로별 통계 생성
    // ========================================
    function generateReferralStats(transactions) {
        const referralData = {};
        let totalRevenue = 0;
    
        transactions.forEach(t => {
            const source = t.referralSource || '미입력';
            if (!referralData[source]) {
                referralData[source] = {
                    count: 0,
                    totalRevenue: 0
                };
            }
    
            referralData[source].count++;
            referralData[source].totalRevenue += t.totalCost || 0;
            totalRevenue += t.totalCost || 0;
        });
    
        const sortedReferrals = Object.keys(referralData).sort((a, b) => 
            referralData[b].totalRevenue - referralData[a].totalRevenue
        );
    
        const tbody = document.getElementById('referralStatsBody');
        
        if (sortedReferrals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">데이터가 없습니다</td></tr>';
            return;
        }
    
        tbody.innerHTML = sortedReferrals.map(referral => {
            const data = referralData[referral];
            const avgPrice = Math.round(data.totalRevenue / data.count);
            const share = ((data.totalRevenue / totalRevenue) * 100).toFixed(1);
    
            return `
                <tr>
                    <td><strong>${referral}</strong></td>
                    <td class="number">${data.count}건</td>
                    <td class="number">₩${formatNumber(data.totalRevenue)}</td>
                    <td class="number">₩${formatNumber(avgPrice)}</td>
                    <td class="number percentage">${share}%</td>
                </tr>
            `;
        }).join('');
    
        tbody.innerHTML += `
            <tr class="total-row">
                <td><strong>합계</strong></td>
                <td class="number">${transactions.length}건</td>
                <td class="number">₩${formatNumber(totalRevenue)}</td>
                <td class="number">-</td>
                <td class="number percentage">100.0%</td>
            </tr>
        `;
        
        // 차트 생성
        createReferralChart(sortedReferrals, referralData);
    }
    
    // ========================================
    // 이벤트 리스너 등록
    // ========================================
    console.log('이벤트 리스너 등록 시작...');
    
    // 비용 계산
    if (totalCostInput) totalCostInput.addEventListener('input', calculateCosts);
    if (materialCostInput) materialCostInput.addEventListener('input', calculateCosts);
    if (laborCostInput) laborCostInput.addEventListener('input', calculateCosts);
    
    // 폼 제출
    if (form) form.addEventListener('submit', handleFormSubmit);
    
    // 검색
    if (searchInput) searchInput.addEventListener('input', handleSearch);
    
    // 필터
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    
    // 월별 필터
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        monthFilter.addEventListener('change', function(e) {
            const selectedMonth = e.target.value;
            
            // 다른 필터 버튼 비활성화
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            if (selectedMonth) {
                const filtered = allTransactions.filter(t => t.date.startsWith(selectedMonth));
                displayTransactions(filtered);
                updateStatistics(filtered);
            } else {
                displayTransactions(allTransactions);
                updateStatistics(allTransactions);
            }
        });
    }
    
    // 통계 탭 전환
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
    
            const tabType = this.dataset.tab;
            document.querySelectorAll('.stats-table-container').forEach(container => {
                container.classList.add('hidden');
            });
            document.getElementById(tabType + 'Stats').classList.remove('hidden');
        });
    });
    
    // 거래 목록의 카드 클릭 이벤트 (이벤트 위임)
    const transactionList = document.getElementById('transactionList');
    if (transactionList) {
        transactionList.addEventListener('click', function(e) {
            const card = e.target.closest('.transaction-item');
            if (card) {
                const id = card.dataset.id;
                openDetailModal(id);
            }
        });
    }
    
    // ========================================
    // 상세 보기 모달 관련
    // ========================================
    const detailModal = document.getElementById('detailModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    let currentDetailId = null;

    // 상세 모달 열기
    function openDetailModal(id) {
        const transaction = allTransactions.find(t => t.id === id);
        if (!transaction) return;
        
        currentDetailId = id;
        
        const detailContent = document.getElementById('detailContent');
        detailContent.innerHTML = `
            <div class="detail-section">
                <div class="detail-section-title">고객 정보</div>
                <div class="detail-grid">
                    <div class="detail-item-box">
                        <div class="detail-item-label">고객명</div>
                        <div class="detail-item-value">${transaction.customerName}</div>
                    </div>
                    <div class="detail-item-box">
                        <div class="detail-item-label">연락처</div>
                        <div class="detail-item-value">${transaction.phone}</div>
                    </div>
                    <div class="detail-item-box">
                        <div class="detail-item-label">작업일</div>
                        <div class="detail-item-value">${transaction.date}</div>
                    </div>
                    <div class="detail-item-box">
                        <div class="detail-item-label">유입 경로</div>
                        <div class="detail-item-value">${transaction.referralSource || '미입력'}${transaction.referralDetail ? ' (' + transaction.referralDetail + ')' : ''}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <div class="detail-section-title">작업 정보</div>
                <div class="detail-grid">
                    <div class="detail-item-box">
                        <div class="detail-item-label">위치</div>
                        <div class="detail-item-value">${transaction.location} ${transaction.detailedLocation || ''}</div>
                    </div>
                    <div class="detail-item-box">
                        <div class="detail-item-label">서비스 유형</div>
                        <div class="detail-item-value">${transaction.serviceType}</div>
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <div class="detail-item-label" style="margin-bottom: 8px;">작업 내용</div>
                    <div class="detail-full">${transaction.content}</div>
                </div>
                ${transaction.notes ? `
                <div style="margin-top: 15px;">
                    <div class="detail-item-label" style="margin-bottom: 8px;">비고</div>
                    <div class="detail-full">${transaction.notes}</div>
                </div>
                ` : ''}
            </div>

            <div class="detail-section">
                <div class="detail-section-title">비용 정보</div>
                <div class="detail-cost-grid">
                    <div class="detail-cost-box">
                        <div class="detail-cost-label">총 비용</div>
                        <div class="detail-cost-value">₩${formatNumber(transaction.totalCost)}</div>
                    </div>
                    <div class="detail-cost-box">
                        <div class="detail-cost-label">자재비</div>
                        <div class="detail-cost-value" style="color: #ff9800;">₩${formatNumber(transaction.materialCost)}</div>
                    </div>
                    <div class="detail-cost-box">
                        <div class="detail-cost-label">인부 비용</div>
                        <div class="detail-cost-value" style="color: #e91e63;">₩${formatNumber(transaction.laborCost)}</div>
                    </div>
                    <div class="detail-cost-box detail-profit">
                        <div class="detail-cost-label">순이익</div>
                        <div class="detail-cost-value">₩${formatNumber(transaction.profit)}</div>
                    </div>
                </div>
            </div>
        `;
        
        detailModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // 상세 모달 닫기
    function closeDetailModal() {
        detailModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        currentDetailId = null;
    }

    // 상세 모달 이벤트
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', closeDetailModal);
    }

    window.addEventListener('click', function(event) {
        if (event.target === detailModal) {
            closeDetailModal();
        }
    });

    // 상세 모달에서 수정 버튼
    const editDetailBtn = document.getElementById('editDetailBtn');
    if (editDetailBtn) {
        editDetailBtn.addEventListener('click', function() {
            console.log('수정 버튼 클릭, currentDetailId:', currentDetailId);
            if (currentDetailId) {
                const idToEdit = currentDetailId;
                closeDetailModal();
                editTransaction(idToEdit);
            }
        });
    }

    // 상세 모달에서 삭제 버튼
    const deleteDetailBtn = document.getElementById('deleteDetailBtn');
    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', function() {
            console.log('삭제 버튼 클릭, currentDetailId:', currentDetailId);
            if (currentDetailId) {
                const idToDelete = currentDetailId;
                closeDetailModal();
                deleteTransaction(idToDelete);
            }
        });
    }
    
    // ========================================
    // 작업 일정 - 달력 및 목록
    // ========================================
    const scheduleDetailModal = document.getElementById('scheduleDetailModal');
    const closeScheduleDetailBtn = document.getElementById('closeScheduleDetailBtn');

    // 일정 데이터 로드
    function loadSchedules() {
        console.log('일정 데이터 로드 시작');
        db.collection('schedules')
            .orderBy('date', 'asc')
            .onSnapshot((snapshot) => {
                console.log('일정 데이터 스냅샷:', snapshot.size, '개');
                allSchedules = [];
                snapshot.forEach((doc) => {
                    allSchedules.push({ id: doc.id, ...doc.data() });
                });
                renderCalendar();
                if (selectedCalendarDate) {
                    showScheduleListForDate(selectedCalendarDate);
                }
            }, (error) => {
                console.error('일정 데이터 로드 에러:', error);
            });
    }

    // 달력 렌더링
    function renderCalendar() {
        const titleEl = document.getElementById('calendarTitle');
        const gridEl = document.getElementById('calendarGrid');
        if (!titleEl || !gridEl) return;

        titleEl.textContent = `${currentCalendarYear}년 ${currentCalendarMonth + 1}월`;

        const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
        const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        const todayStr = new Date().toISOString().split('T')[0];
        const prevLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();

        // 요일 헤더
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        let html = weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('');

        // 이전 달
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            html += `<div class="calendar-day other-month"><div class="calendar-day-number">${prevLastDay - i}</div></div>`;
        }

        // 현재 달
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dow = new Date(currentCalendarYear, currentCalendarMonth, day).getDay();
            
            let cls = 'calendar-day';
            if (dateStr === todayStr) cls += ' today';
            if (dateStr === selectedCalendarDate) cls += ' selected';
            if (dow === 0) cls += ' sunday';
            if (dow === 6) cls += ' saturday';

            const daySchedules = allSchedules.filter(s => s.date === dateStr);
            let schHtml = '<div class="calendar-day-schedules">';
            daySchedules.slice(0, 2).forEach(s => {
                const sCls = s.status === 'completed' ? ' completed' : '';
                schHtml += `<div class="calendar-schedule-dot${sCls}">${s.startTime ? s.startTime.substring(0,5) : ''} ${s.customerName}</div>`;
            });
            if (daySchedules.length > 2) {
                schHtml += `<div class="calendar-more-count">+${daySchedules.length - 2}건</div>`;
            }
            schHtml += '</div>';

            html += `<div class="${cls}" data-date="${dateStr}" onclick="handleCalendarDayClick('${dateStr}')">
                <div class="calendar-day-number">${day}</div>${schHtml}</div>`;
        }

        // 다음 달
        const totalCells = startDayOfWeek + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remaining; i++) {
            html += `<div class="calendar-day other-month"><div class="calendar-day-number">${i}</div></div>`;
        }

        gridEl.innerHTML = html;
    }

    // 날짜 클릭
    window.handleCalendarDayClick = function(dateStr) {
        selectedCalendarDate = dateStr;
        renderCalendar();
        showScheduleListForDate(dateStr);
    };

    // 날짜별 일정 목록
    function showScheduleListForDate(dateStr) {
        const section = document.getElementById('scheduleListSection');
        const titleEl = document.getElementById('scheduleListTitle');
        const listEl = document.getElementById('scheduleList');
        if (!section || !listEl) return;

        const daySchedules = allSchedules.filter(s => s.date === dateStr);
        const d = new Date(dateStr + 'T00:00:00');
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
        const fDate = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${weekDays[d.getDay()]})`;

        titleEl.textContent = `📅 ${fDate} 일정 (${daySchedules.length}건)`;
        section.style.display = 'block';

        if (daySchedules.length === 0) {
            listEl.innerHTML = `<div class="empty-state" style="padding:30px;">
                <div class="empty-state-icon">📋</div>
                <h3>이 날짜에 등록된 일정이 없습니다</h3>
                <p>거래 등록 시 "작업 일정도 함께 등록" 체크박스를 선택하면 일정이 자동 등록됩니다</p>
            </div>`;
            return;
        }

        daySchedules.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

        listEl.innerHTML = daySchedules.map(s => {
            const timeStr = s.startTime ? s.startTime.substring(0, 5) : '';
            const endStr = s.endTime ? ` ~ ${s.endTime.substring(0, 5)}` : '';
            const cCls = s.status === 'completed' ? ' completed' : '';
            return `<div class="schedule-item${cCls}" onclick="openScheduleDetailModal('${s.id}')">
                <div class="schedule-item-header">
                    <div class="schedule-item-time">🕐 ${timeStr}${endStr}</div>
                    <div class="schedule-item-service">${s.serviceType}</div>
                </div>
                <div class="schedule-item-body">
                    <div class="schedule-item-info"><div class="label">고객명</div><div>👤 ${s.customerName}</div></div>
                    <div class="schedule-item-info"><div class="label">위치</div><div>📍 ${s.location} ${s.detailedLocation || ''}</div></div>
                </div>
            </div>`;
        }).join('');
    }

    // 달력 이전/다음 월
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) { currentCalendarMonth = 11; currentCalendarYear--; }
            selectedCalendarDate = null;
            document.getElementById('scheduleListSection').style.display = 'none';
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) { currentCalendarMonth = 0; currentCalendarYear++; }
            selectedCalendarDate = null;
            document.getElementById('scheduleListSection').style.display = 'none';
            renderCalendar();
        });
    }

    // 일정 상세 모달
    window.openScheduleDetailModal = function(id) {
        const schedule = allSchedules.find(s => s.id === id);
        if (!schedule) return;

        currentScheduleDetailId = id;
        const content = document.getElementById('scheduleDetailContent');
        const timeStr = schedule.startTime ? schedule.startTime.substring(0, 5) : '-';
        const endTimeStr = schedule.endTime ? schedule.endTime.substring(0, 5) : '-';
        const statusBadge = schedule.status === 'completed'
            ? '<span class="schedule-status-badge completed">✅ 완료</span>'
            : '<span class="schedule-status-badge pending">⏳ 예정</span>';
        
        const linkedHtml = schedule.linkedTransactionId 
            ? `<div style="margin-top:5px;"><span class="linked-transaction-badge" onclick="goToLinkedTransaction('${schedule.linkedTransactionId}')">🔗 연결된 거래 보기</span></div>` 
            : '';

        content.innerHTML = `
            <div class="detail-section">
                <div class="detail-section-title">상태</div>
                ${statusBadge}${linkedHtml}
            </div>
            <div class="detail-section">
                <div class="detail-section-title">고객 정보</div>
                <div class="detail-grid">
                    <div class="detail-item-box"><div class="detail-item-label">고객명</div><div class="detail-item-value">${schedule.customerName}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">연락처</div><div class="detail-item-value">${schedule.phone || '-'}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">일정 정보</div>
                <div class="detail-grid">
                    <div class="detail-item-box"><div class="detail-item-label">작업 날짜</div><div class="detail-item-value">${schedule.date}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">작업 시간</div><div class="detail-item-value">${timeStr} ~ ${endTimeStr}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">위치</div><div class="detail-item-value">${schedule.location} ${schedule.detailedLocation || ''}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">서비스 유형</div><div class="detail-item-value">${schedule.serviceType}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">작업 내용</div>
                <div class="detail-full">${schedule.workContent || '-'}</div>
            </div>
            ${schedule.materials ? `<div class="detail-section"><div class="detail-section-title">🔧 필요 자재</div><div class="materials-list">${schedule.materials}</div></div>` : ''}
            ${schedule.scheduleNotes ? `<div class="detail-section"><div class="detail-section-title">일정 메모</div><div class="detail-full">${schedule.scheduleNotes}</div></div>` : ''}
        `;

        // 버튼 업데이트
        const actionsEl = document.getElementById('scheduleDetailActions');
        if (schedule.status === 'completed') {
            actionsEl.innerHTML = `
                <button class="btn-action" style="background:#ff9800;color:white;" id="undoCompleteBtn">↩️ 미완료</button>
                <button class="btn-action btn-delete-action" id="deleteScheduleBtn">🗑️ 삭제</button>`;
        } else {
            actionsEl.innerHTML = `
                <button class="btn-action btn-complete-action" id="completeScheduleBtn">✅ 완료 처리</button>
                <button class="btn-action btn-delete-action" id="deleteScheduleBtn">🗑️ 삭제</button>`;
        }

        // 이벤트
        const compBtn = document.getElementById('completeScheduleBtn');
        const undoBtn = document.getElementById('undoCompleteBtn');
        const delBtn = document.getElementById('deleteScheduleBtn');

        if (compBtn) {
            compBtn.addEventListener('click', async function() {
                try {
                    await db.collection('schedules').doc(currentScheduleDetailId).update({ status: 'completed' });
                    alert('✅ 작업 완료 처리되었습니다!');
                    closeScheduleDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }
        if (undoBtn) {
            undoBtn.addEventListener('click', async function() {
                try {
                    await db.collection('schedules').doc(currentScheduleDetailId).update({ status: 'pending' });
                    alert('↩️ 미완료로 변경되었습니다.');
                    closeScheduleDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }
        if (delBtn) {
            delBtn.addEventListener('click', async function() {
                if (!confirm('정말 이 작업 일정을 삭제하시겠습니까?')) return;
                try {
                    await db.collection('schedules').doc(currentScheduleDetailId).delete();
                    alert('✅ 삭제되었습니다!');
                    closeScheduleDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }

        scheduleDetailModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    function closeScheduleDetailModal() {
        if (scheduleDetailModal) {
            scheduleDetailModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        currentScheduleDetailId = null;
    }

    if (closeScheduleDetailBtn) {
        closeScheduleDetailBtn.addEventListener('click', closeScheduleDetailModal);
    }

    window.addEventListener('click', function(event) {
        if (event.target === scheduleDetailModal) {
            closeScheduleDetailModal();
        }
    });

    // 연결된 거래 보기
    window.goToLinkedTransaction = function(transactionId) {
        closeScheduleDetailModal();
        // 거래 내역 탭으로 전환
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.querySelector('[data-view="transactions"]').classList.add('active');
        document.getElementById('transactionsView').classList.add('active');
        // 해당 거래 상세 열기
        setTimeout(() => openDetailModal(transactionId), 300);
    };

    // ========================================
    // 초기화
    // ========================================
    console.log('앱 초기화 시작...');
    setDefaultDate();
    loadTransactions();
    loadSchedules();
    
    console.log('=== 앱 초기화 완료 ===');
});

console.log('=== app-compat.js 로드 완료 ===');
// ========================================
// 차트 생성 함수들
// ========================================

// 전역 차트 객체
let monthlyChart = null;
let locationChart = null;
let serviceChart = null;
let referralChart = null;

// 월별 차트 생성 (선 그래프 - 최근 12개월)
function createMonthlyChart(months, data) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // 최근 12개월만 선택
    const recentMonths = months.slice(0, 12);
    const labels = [...recentMonths].reverse(); // 오래된 순으로
    const revenues = labels.map(month => data[month].totalRevenue);
    const profits = labels.map(month => data[month].profit);
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '총 매출',
                    data: revenues,
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: '순이익',
                    data: profits,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8,
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 13,
                            weight: '500'
                        }
                    }
                },
                title: {
                    display: true,
                    text: '월별 매출 및 순이익 추이 (최근 12개월)',
                    font: { 
                        size: 16, 
                        weight: 'bold' 
                    },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₩' + context.parsed.y.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '금액 (원)',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return '₩' + (value / 10000).toFixed(0) + '만';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// 지역별 차트 생성 (도넛 차트 - 거래 건수 기준)
function createLocationChart(locations, data) {
    const ctx = document.getElementById('locationChart');
    if (!ctx) return;
    
    if (locationChart) {
        locationChart.destroy();
    }
    
    const colors = [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(244, 67, 54, 0.8)',
        'rgba(33, 150, 243, 0.8)',
        'rgba(156, 39, 176, 0.8)',
        'rgba(0, 188, 212, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(96, 125, 139, 0.8)'
    ];
    
    locationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: locations,
            datasets: [{
                label: '거래 건수',
                data: locations.map(loc => data[loc].count),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: '지역별 거래 건수 분포',
                    font: { size: 16, weight: 'bold' },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value + '건 (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// 서비스별 차트 생성 (가로 막대 그래프 - 거래 건수 기준)
function createServiceChart(services, data) {
    const ctx = document.getElementById('serviceChart');
    if (!ctx) return;
    
    if (serviceChart) {
        serviceChart.destroy();
    }
    
    serviceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: services,
            datasets: [{
                label: '거래 건수',
                data: services.map(service => data[service].count),
                backgroundColor: 'rgba(76, 175, 80, 0.7)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: '서비스별 거래 건수',
                    font: { size: 16, weight: 'bold' },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return '거래 건수: ' + context.parsed.x + '건';
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '거래 건수',
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    },
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return value + '건';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// 유입 경로별 차트 생성 (파이 차트 - 거래 건수 기준)
function createReferralChart(referrals, data) {
    const ctx = document.getElementById('referralChart');
    if (!ctx) return;
    
    if (referralChart) {
        referralChart.destroy();
    }
    
    const colors = [
        'rgba(102, 126, 234, 0.8)',
        'rgba(255, 152, 0, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(244, 67, 54, 0.8)',
        'rgba(33, 150, 243, 0.8)',
        'rgba(156, 39, 176, 0.8)',
        'rgba(0, 188, 212, 0.8)',
        'rgba(255, 193, 7, 0.8)'
    ];
    
    referralChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: referrals,
            datasets: [{
                label: '거래 건수',
                data: referrals.map(ref => data[ref].count),
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                title: {
                    display: true,
                    text: '유입 경로별 거래 건수 분포',
                    font: { size: 16, weight: 'bold' },
                    padding: {
                        bottom: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value + '건 (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}


// ========================================
// 메인 네비게이션 탭 전환
// ========================================
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        // 탭 활성화
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // 뷰 전환
        const view = this.dataset.view;
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById(view + 'View').classList.add('active');
    });
});

// ========================================
// PWA Service Worker 등록
// ========================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker 등록 성공:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker 등록 실패:', error);
            });
    });
}

// 홈 화면 추가 안내
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 설치 프롬프트 방지
    e.preventDefault();
    // 나중에 사용하기 위해 저장
    deferredPrompt = e;
    console.log('💡 앱 설치 가능 - 홈 화면에 추가할 수 있습니다');
});

// 설치 완료 이벤트
window.addEventListener('appinstalled', () => {
    console.log('🎉 앱이 홈 화면에 추가되었습니다!');
    deferredPrompt = null;
});