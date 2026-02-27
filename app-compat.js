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
let allExpenses = [];
let currentCalendarYear = new Date().getFullYear();
let currentCalendarMonth = new Date().getMonth();
let selectedCalendarDate = null;
let currentScheduleDetailId = null;
let currentExpenseEditId = null;
let currentExpenseDetailId = null;

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
            // 토글 켜면 작업일을 일정 시작일 기본값으로
            if (this.checked) {
                const dateVal = document.getElementById('date').value;
                const scheduleStartDateInput = document.getElementById('scheduleStartDate');
                if (dateVal && scheduleStartDateInput) {
                    scheduleStartDateInput.value = dateVal;
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
            const sDate = document.getElementById('scheduleStartDate').value;
            const sTime = document.getElementById('scheduleStartTime').value;
            if (!sDate || !sTime) {
                alert('⚠️ 작업 일정의 시작일과 시작 시간을 입력해주세요.');
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
            paymentStatus: document.querySelector('input[name="paymentStatus"]:checked').value,
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
                const startDate = document.getElementById('scheduleStartDate').value;
                const endDate = document.getElementById('scheduleEndDate').value || startDate;
                const scheduleData = {
                    customerName: transactionData.customerName,
                    phone: transactionData.phone,
                    location: transactionData.location,
                    detailedLocation: transactionData.detailedLocation,
                    serviceType: transactionData.serviceType,
                    workContent: transactionData.content,
                    date: startDate,
                    startDate: startDate,
                    endDate: endDate,
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
                updateUnpaidSummary(allTransactions);
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
        const isUnpaid = transaction.paymentStatus === 'unpaid';
        const itemClass = isUnpaid ? 'transaction-item unpaid-item' : 'transaction-item';
        const paymentBadge = isUnpaid 
            ? '<span class="unpaid-badge">🔴 미수금</span>' 
            : '<span class="paid-badge">💰 정산완료</span>';

        return `
            <div class="${itemClass}" data-id="${transaction.id}">
                <div class="transaction-header">
                    <div class="customer-name">👤 ${transaction.customerName} ${paymentBadge}</div>
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
    // 미수금 요약 업데이트
    // ========================================
    function updateUnpaidSummary(transactions) {
        const unpaidItems = transactions.filter(t => t.paymentStatus === 'unpaid');
        const unpaidTotal = unpaidItems.reduce((sum, t) => sum + (t.totalCost || 0), 0);
        
        const summaryEl = document.getElementById('unpaidSummary');
        const countEl = document.getElementById('unpaidCount');
        const amountEl = document.getElementById('unpaidAmount');
        
        if (summaryEl && countEl && amountEl) {
            if (unpaidItems.length > 0) {
                summaryEl.style.display = 'flex';
                countEl.textContent = `${unpaidItems.length}건의 미수금`;
                amountEl.textContent = `₩${formatNumber(unpaidTotal)}`;
            } else {
                summaryEl.style.display = 'none';
            }
        }
    }
    
    // 미수금만 필터 (전역 함수)
    window.filterUnpaidOnly = function() {
        const filtered = allTransactions.filter(t => t.paymentStatus === 'unpaid');
        displayTransactions(filtered);
        
        // 필터 버튼 상태 업데이트
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        const unpaidBtn = document.querySelector('.filter-btn[data-filter="unpaid"]');
        if (unpaidBtn) unpaidBtn.classList.add('active');
        
        // 월별 선택 초기화
        const monthFilterEl = document.getElementById('monthFilter');
        if (monthFilterEl) monthFilterEl.value = '';
    };
    
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
        
        // 수금 상태 복원
        const paymentVal = transaction.paymentStatus || 'paid';
        const paymentRadio = document.querySelector(`input[name="paymentStatus"][value="${paymentVal}"]`);
        if (paymentRadio) paymentRadio.checked = true;
        
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
        } else if (filter === 'unpaid') {
            filtered = allTransactions.filter(t => t.paymentStatus === 'unpaid');
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
                    profit: 0,
                    expense: 0,
                    netProfit: 0
                };
            }
    
            monthlyData[month].count++;
            monthlyData[month].totalRevenue += t.totalCost || 0;
            monthlyData[month].materialCost += t.materialCost || 0;
            monthlyData[month].laborCost += t.laborCost || 0;
            monthlyData[month].profit += t.profit || 0;
        });

        // 지출 데이터 병합
        allExpenses.forEach(e => {
            if (!e.date) return;
            const month = e.date.substring(0, 7);
            if (!monthlyData[month]) {
                monthlyData[month] = {
                    count: 0,
                    totalRevenue: 0,
                    materialCost: 0,
                    laborCost: 0,
                    profit: 0,
                    expense: 0,
                    netProfit: 0
                };
            }
            monthlyData[month].expense += e.amount || 0;
        });

        // 실순이익 계산
        Object.keys(monthlyData).forEach(month => {
            const d = monthlyData[month];
            d.netProfit = d.profit - d.expense;
        });
    
        const sortedMonths = Object.keys(monthlyData).sort().reverse();
        const tbody = document.getElementById('monthlyStatsBody');
        
        if (sortedMonths.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="loading">데이터가 없습니다</td></tr>';
            return;
        }
    
        let totalCount = 0;
        let totalRevenue = 0;
        let totalMaterialCost = 0;
        let totalLaborCost = 0;
        let totalProfit = 0;
        let totalExpense = 0;
        let totalNetProfit = 0;
    
        tbody.innerHTML = sortedMonths.map(month => {
            const data = monthlyData[month];
    
            totalCount += data.count;
            totalRevenue += data.totalRevenue;
            totalMaterialCost += data.materialCost;
            totalLaborCost += data.laborCost;
            totalProfit += data.profit;
            totalExpense += data.expense;
            totalNetProfit += data.netProfit;

            const netColor = data.netProfit >= 0 ? '#4CAF50' : '#f44336';
    
            return `
                <tr>
                    <td><strong>${month}</strong></td>
                    <td class="number">${data.count}건</td>
                    <td class="number">₩${formatNumber(data.totalRevenue)}</td>
                    <td class="number">₩${formatNumber(data.materialCost)}</td>
                    <td class="number">₩${formatNumber(data.laborCost)}</td>
                    <td class="number">₩${formatNumber(data.profit)}</td>
                    <td class="number" style="color:#f44336;">₩${formatNumber(data.expense)}</td>
                    <td class="number" style="color:${netColor};font-weight:bold;">₩${formatNumber(data.netProfit)}</td>
                </tr>
            `;
        }).join('');
    
        const netTotalColor = totalNetProfit >= 0 ? '#4CAF50' : '#f44336';
        tbody.innerHTML += `
            <tr class="total-row">
                <td><strong>합계</strong></td>
                <td class="number">${totalCount}건</td>
                <td class="number">₩${formatNumber(totalRevenue)}</td>
                <td class="number">₩${formatNumber(totalMaterialCost)}</td>
                <td class="number">₩${formatNumber(totalLaborCost)}</td>
                <td class="number">₩${formatNumber(totalProfit)}</td>
                <td class="number" style="color:#f44336;">₩${formatNumber(totalExpense)}</td>
                <td class="number" style="color:${netTotalColor};font-weight:bold;">₩${formatNumber(totalNetProfit)}</td>
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
                <div style="margin-top: 15px; text-align: center;">
                    ${transaction.paymentStatus === 'unpaid' 
                        ? '<span class="unpaid-badge" style="font-size:1em;padding:8px 20px;">🔴 미수금</span>' 
                        : '<span class="paid-badge" style="font-size:1em;padding:8px 20px;">💰 정산완료</span>'}
                </div>
            </div>
        `;
        
        // 상세 모달 액션 버튼 업데이트
        const detailActionsEl = detailModal.querySelector('.detail-actions');
        if (transaction.paymentStatus === 'unpaid') {
            detailActionsEl.innerHTML = `
                <button class="btn-action btn-complete-action" id="markPaidBtn">💰 정산완료</button>
                <button class="btn-action" style="background:#2196F3;color:white;" id="invoiceBtn">📄 명세서</button>
                <button class="btn-action btn-edit-action" id="editDetailBtn">✏️ 수정</button>
                <button class="btn-action btn-delete-action" id="deleteDetailBtn">🗑️ 삭제</button>
            `;
        } else {
            detailActionsEl.innerHTML = `
                <button class="btn-action" style="background:#ff9800;color:white;" id="markUnpaidBtn">🔴 미수금</button>
                <button class="btn-action" style="background:#2196F3;color:white;" id="invoiceBtn">📄 명세서</button>
                <button class="btn-action btn-edit-action" id="editDetailBtn">✏️ 수정</button>
                <button class="btn-action btn-delete-action" id="deleteDetailBtn">🗑️ 삭제</button>
            `;
        }

        // 정산완료 처리 버튼
        const markPaidBtn = document.getElementById('markPaidBtn');
        if (markPaidBtn) {
            markPaidBtn.addEventListener('click', async function() {
                try {
                    await db.collection('transactions').doc(currentDetailId).update({ paymentStatus: 'paid' });
                    alert('💰 정산완료 처리되었습니다!');
                    closeDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }
        
        // 미수금으로 변경 버튼
        const markUnpaidBtn = document.getElementById('markUnpaidBtn');
        if (markUnpaidBtn) {
            markUnpaidBtn.addEventListener('click', async function() {
                try {
                    await db.collection('transactions').doc(currentDetailId).update({ paymentStatus: 'unpaid' });
                    alert('🔴 미수금으로 변경되었습니다.');
                    closeDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }

        // 수정/삭제 버튼 재바인딩
        const editDetailBtn2 = document.getElementById('editDetailBtn');
        const deleteDetailBtn2 = document.getElementById('deleteDetailBtn');
        
        if (editDetailBtn2) {
            editDetailBtn2.addEventListener('click', function() {
                if (currentDetailId) {
                    const idToEdit = currentDetailId;
                    closeDetailModal();
                    editTransaction(idToEdit);
                }
            });
        }
        if (deleteDetailBtn2) {
            deleteDetailBtn2.addEventListener('click', function() {
                if (currentDetailId) {
                    const idToDelete = currentDetailId;
                    closeDetailModal();
                    deleteTransaction(idToDelete);
                }
            });
        }

        // 명세서 버튼
        const invoiceBtn = document.getElementById('invoiceBtn');
        if (invoiceBtn) {
            invoiceBtn.addEventListener('click', function() {
                if (currentDetailId) {
                    const idForInvoice = currentDetailId;
                    closeDetailModal();
                    openInvoiceFormModal(idForInvoice);
                }
            });
        }

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

            const daySchedules = allSchedules.filter(s => {
                const sStart = s.startDate || s.date;
                const sEnd = s.endDate || sStart;
                return dateStr >= sStart && dateStr <= sEnd;
            });
            let schHtml = '<div class="calendar-day-schedules">';
            daySchedules.slice(0, 2).forEach(s => {
                const sCls = s.status === 'completed' ? ' completed' : '';
                const sStart = s.startDate || s.date;
                const sEnd = s.endDate || sStart;
                const isMulti = sStart !== sEnd;
                const dotCls = isMulti ? ' multi-day' : '';
                const timeLabel = (dateStr === sStart && s.startTime) ? s.startTime.substring(0,5) + ' ' : '';
                schHtml += `<div class="calendar-schedule-dot${sCls}${dotCls}">${timeLabel}${s.customerName}</div>`;
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

        const daySchedules = allSchedules.filter(s => {
            const sStart = s.startDate || s.date;
            const sEnd = s.endDate || sStart;
            return dateStr >= sStart && dateStr <= sEnd;
        });
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
            const sStart = s.startDate || s.date;
            const sEnd = s.endDate || sStart;
            const isMulti = sStart !== sEnd;
            const periodBadge = isMulti ? `<span style="background:#fff3e0;color:#ff9800;padding:2px 8px;border-radius:10px;font-size:0.8em;font-weight:600;margin-left:8px;">📅 ${sStart} ~ ${sEnd}</span>` : '';
            return `<div class="schedule-item${cCls}" onclick="openScheduleDetailModal('${s.id}')">
                <div class="schedule-item-header">
                    <div class="schedule-item-time">🕐 ${timeStr}${endStr}${periodBadge}</div>
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

        const sStart = schedule.startDate || schedule.date;
        const sEnd = schedule.endDate || sStart;
        const isMultiDay = sStart !== sEnd;
        const periodStr = isMultiDay ? `${sStart} ~ ${sEnd}` : sStart;
        const daysCount = isMultiDay ? Math.ceil((new Date(sEnd) - new Date(sStart)) / (1000*60*60*24)) + 1 : 1;
        const periodBadge = isMultiDay ? ` <span style="background:#fff3e0;color:#ff9800;padding:2px 8px;border-radius:10px;font-size:0.85em;font-weight:600;">${daysCount}일간</span>` : '';

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
                    <div class="detail-item-box"><div class="detail-item-label">작업 기간</div><div class="detail-item-value">${periodStr}${periodBadge}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">작업 시간</div><div class="detail-item-value">${timeStr} ~ ${endTimeStr}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">위치</div><div class="detail-item-value">${schedule.location} ${schedule.detailedLocation || ''}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">서비스 유형</div><div class="detail-item-value">${schedule.serviceType}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">작업 내용</div>
                <div class="detail-full">${schedule.workContent || '-'}</div>
            </div>
            ${schedule.materials ? `<div class="detail-section"><div class="detail-section-title">🔧 필요 자재</div><div class="materials-list">${schedule.materials}</div></span></div>` : ''}
            ${schedule.scheduleNotes ? `<div class="detail-section"><div class="detail-section-title">일정 메모</div><div class="detail-full">${schedule.scheduleNotes}</div></span></div>` : ''}
        `;

        // 버튼 업데이트
        const actionsEl = document.getElementById('scheduleDetailActions');
        if (schedule.status === 'completed') {
            actionsEl.innerHTML = `
                <button class="btn-action" style="background:#ff9800;color:white;" id="undoCompleteBtn">↩️ 미완료</button>
                <button class="btn-action btn-edit-action" id="editScheduleBtnAction">✏️ 수정</button>
                <button class="btn-action btn-delete-action" id="deleteScheduleBtn">🗑️ 삭제</button>`;
        } else {
            actionsEl.innerHTML = `
                <button class="btn-action btn-complete-action" id="completeScheduleBtn">✅ 완료 처리</button>
                <button class="btn-action btn-edit-action" id="editScheduleBtnAction">✏️ 수정</button>
                <button class="btn-action btn-delete-action" id="deleteScheduleBtn">🗑️ 삭제</button>`;
        }

        // 이벤트
        const compBtn = document.getElementById('completeScheduleBtn');
        const undoBtn = document.getElementById('undoCompleteBtn');
        const delBtn = document.getElementById('deleteScheduleBtn');
        const editBtn = document.getElementById('editScheduleBtnAction');

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
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                const idToEdit = currentScheduleDetailId;
                closeScheduleDetailModal();
                openScheduleEditModal(idToEdit);
            });
        }

        scheduleDetailModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    // ========================================
    // 일정 수정 모달
    // ========================================
    const scheduleEditModal = document.getElementById('scheduleEditModal');
    const closeScheduleEditBtn = document.getElementById('closeScheduleEditBtn');
    const scheduleEditForm = document.getElementById('scheduleEditForm');
    let currentScheduleEditId = null;

    function openScheduleEditModal(id) {
        const schedule = allSchedules.find(s => s.id === id);
        if (!schedule) return;

        currentScheduleEditId = id;

        const sStart = schedule.startDate || schedule.date || '';
        const sEnd = schedule.endDate || '';
        document.getElementById('editSchStartDate').value = sStart;
        document.getElementById('editSchEndDate').value = (sEnd && sEnd !== sStart) ? sEnd : '';
        document.getElementById('editSchStartTime').value = schedule.startTime || '';
        document.getElementById('editSchEndTime').value = schedule.endTime || '';
        document.getElementById('editSchServiceType').value = schedule.serviceType || '';
        document.getElementById('editSchLocation').value = schedule.location || '';
        document.getElementById('editSchDetailedLocation').value = schedule.detailedLocation || '';
        document.getElementById('editSchWorkContent').value = schedule.workContent || '';
        document.getElementById('editSchMaterials').value = schedule.materials || '';
        document.getElementById('editSchNotes').value = schedule.scheduleNotes || '';

        scheduleEditModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeScheduleEditModal() {
        if (scheduleEditModal) {
            scheduleEditModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        currentScheduleEditId = null;
    }

    if (closeScheduleEditBtn) {
        closeScheduleEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeScheduleEditModal();
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === scheduleEditModal) {
            closeScheduleEditModal();
        }
    });

    if (scheduleEditForm) {
        scheduleEditForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!currentScheduleEditId) return;

            const startDate = document.getElementById('editSchStartDate').value;
            const endDate = document.getElementById('editSchEndDate').value || startDate;
            const updateData = {
                date: startDate,
                startDate: startDate,
                endDate: endDate,
                startTime: document.getElementById('editSchStartTime').value,
                endTime: document.getElementById('editSchEndTime').value || '',
                serviceType: document.getElementById('editSchServiceType').value,
                location: document.getElementById('editSchLocation').value,
                detailedLocation: document.getElementById('editSchDetailedLocation').value || '',
                workContent: document.getElementById('editSchWorkContent').value,
                materials: document.getElementById('editSchMaterials').value || '',
                scheduleNotes: document.getElementById('editSchNotes').value || ''
            };

            try {
                await db.collection('schedules').doc(currentScheduleEditId).update(updateData);
                alert('✅ 작업 일정이 수정되었습니다!');
                closeScheduleEditModal();
            } catch (err) {
                alert('❌ 수정 중 오류가 발생했습니다: ' + err.message);
            }
        });
    }

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
    // 지출 내역 관련
    // ========================================
    const expenseModal = document.getElementById('expenseModal');
    const openExpenseModalBtn = document.getElementById('openExpenseModalBtn');
    const closeExpenseModalBtn = document.getElementById('closeExpenseModalBtn');
    const expenseForm = document.getElementById('expenseForm');
    const expenseDetailModal = document.getElementById('expenseDetailModal');
    const closeExpenseDetailBtn = document.getElementById('closeExpenseDetailBtn');

    // 지출 모달 열기/닫기
    function openExpenseModal() {
        if (expenseModal) {
            expenseModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeExpenseModal() {
        if (expenseModal) {
            expenseModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            if (currentExpenseEditId) {
                currentExpenseEditId = null;
                document.getElementById('expenseSubmitBtn').textContent = '✅ 운영비 저장';
            }
            expenseForm.reset();
            const eDateInput = document.getElementById('expenseDate');
            if (eDateInput) eDateInput.valueAsDate = new Date();
        }
    }

    if (openExpenseModalBtn) {
        openExpenseModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openExpenseModal();
        });
    }
    if (closeExpenseModalBtn) {
        closeExpenseModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeExpenseModal();
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === expenseModal) closeExpenseModal();
        if (event.target === expenseDetailModal) closeExpenseDetailModal();
    });

    // 지출 폼 제출
    if (expenseForm) {
        expenseForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const expenseData = {
                date: document.getElementById('expenseDate').value,
                category: document.getElementById('expenseCategory').value,
                description: document.getElementById('expenseDescription').value,
                amount: parseInt(document.getElementById('expenseAmount').value) || 0,
                payMethod: document.getElementById('expensePayMethod').value,
                notes: document.getElementById('expenseNotes').value,
                timestamp: new Date().toISOString()
            };

            try {
                if (currentExpenseEditId) {
                    await db.collection('expenses').doc(currentExpenseEditId).update(expenseData);
                    alert('✅ 운영비가 수정되었습니다!');
                    currentExpenseEditId = null;
                    document.getElementById('expenseSubmitBtn').textContent = '✅ 운영비 저장';
                } else {
                    await db.collection('expenses').add(expenseData);
                    alert('✅ 운영비가 저장되었습니다!');
                }
                expenseForm.reset();
                closeExpenseModal();
            } catch (error) {
                alert('❌ 오류: ' + error.message);
            }
        });
    }

    // 지출 데이터 로드
    function loadExpenses() {
        db.collection('expenses')
            .orderBy('date', 'desc')
            .onSnapshot((snapshot) => {
                allExpenses = [];
                snapshot.forEach((doc) => {
                    allExpenses.push({ id: doc.id, ...doc.data() });
                });
                displayExpenses(allExpenses);
                updateExpenseSummary(allExpenses);
                populateExpenseMonthFilter();
                // 지출 변경 시 월별 통계 갱신 (지출이 포함되므로)
                if (allTransactions.length > 0) {
                    generateMonthlyStats(allTransactions);
                }
            }, (error) => {
                console.error('지출 데이터 에러:', error);
            });
    }

    // 지출 목록 표시
    function displayExpenses(expenses) {
        const listEl = document.getElementById('expenseList');
        if (!listEl) return;

        if (expenses.length === 0) {
            listEl.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💸</div>
                <h3>등록된 운영비가 없습니다</h3><p>위 버튼을 클릭하여 운영비를 등록하세요</p></div>`;
            return;
        }

        listEl.innerHTML = expenses.map(exp => {
            const categoryIcons = {
                '장비/공구': '🔧', '자재 구매': '📦', '차량/유류': '🚗', '보험/세금': '📋',
                '통신비': '📱', '사무용품': '🖊️', '식대/접대': '🍽️', '교육/자격증': '📚', '운영비': '💼', '기타': '📌'
            };
            const icon = categoryIcons[exp.category] || '📌';
            return `<div class="expense-item" data-expense-id="${exp.id}" onclick="openExpenseDetailModal('${exp.id}')">
                <div class="expense-item-header">
                    <div class="expense-item-category">${icon} ${exp.category}</div>
                    <div class="expense-item-date">📅 ${exp.date}</div>
                </div>
                <div class="expense-item-desc">${exp.description}</div>
                <div class="expense-item-footer">
                    <div class="expense-item-amount">-₩${formatNumber(exp.amount)}</div>
                    <div class="expense-item-method">${exp.payMethod || ''}</div>
                </div>
            </div>`;
        }).join('');
    }

    // 지출 요약 업데이트
    function updateExpenseSummary(expenses) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(currentMonth));
        const monthTotal = monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const allTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        const monthEl = document.getElementById('expenseMonthTotal');
        const allEl = document.getElementById('expenseAllTotal');
        if (monthEl) monthEl.textContent = `₩${formatNumber(monthTotal)}`;
        if (allEl) allEl.textContent = `₩${formatNumber(allTotal)}`;
    }

    // 지출 월별 필터 채우기
    function populateExpenseMonthFilter() {
        const monthFilter = document.getElementById('expenseMonthFilter');
        if (!monthFilter) return;

        const months = new Set();
        allExpenses.forEach(e => {
            if (e.date) months.add(e.date.substring(0, 7));
        });

        const sorted = Array.from(months).sort().reverse();
        monthFilter.innerHTML = '<option value="">월별 조회</option>';
        sorted.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            monthFilter.appendChild(opt);
        });
    }

    // 지출 검색
    const expenseSearchInput = document.getElementById('expenseSearchInput');
    if (expenseSearchInput) {
        expenseSearchInput.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const filtered = allExpenses.filter(ex =>
                (ex.description || '').toLowerCase().includes(term) ||
                (ex.category || '').toLowerCase().includes(term) ||
                (ex.notes || '').toLowerCase().includes(term)
            );
            displayExpenses(filtered);
        });
    }

    // 지출 필터
    document.querySelectorAll('.expense-filter-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            document.querySelectorAll('.expense-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const expMonthFilter = document.getElementById('expenseMonthFilter');
            if (expMonthFilter) expMonthFilter.value = '';

            const filter = this.dataset.filter;
            let filtered = allExpenses;

            if (filter === 'month') {
                const now = new Date();
                const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                filtered = allExpenses.filter(ex => ex.date && ex.date.startsWith(cm));
            } else if (filter === 'equipment') {
                filtered = allExpenses.filter(ex => ex.category === '장비/공구' || ex.category === '자재 구매');
            } else if (filter === 'vehicle') {
                filtered = allExpenses.filter(ex => ex.category === '차량/유류');
            } else if (filter === 'operation') {
                filtered = allExpenses.filter(ex => ex.category === '일반 운영비' || ex.category === '보험/세금' || ex.category === '통신비' || ex.category === '사무용품');
            }

            displayExpenses(filtered);
        });
    });

    // 지출 월별 필터
    const expenseMonthFilter = document.getElementById('expenseMonthFilter');
    if (expenseMonthFilter) {
        expenseMonthFilter.addEventListener('change', function(e) {
            const sel = e.target.value;
            document.querySelectorAll('.expense-filter-btn').forEach(b => b.classList.remove('active'));
            if (sel) {
                displayExpenses(allExpenses.filter(ex => ex.date && ex.date.startsWith(sel)));
            } else {
                displayExpenses(allExpenses);
            }
        });
    }

    // 지출 상세 모달
    window.openExpenseDetailModal = function(id) {
        const expense = allExpenses.find(e => e.id === id);
        if (!expense) return;

        currentExpenseDetailId = id;
        const content = document.getElementById('expenseDetailContent');

        content.innerHTML = `
            <div class="expense-detail-amount">-₩${formatNumber(expense.amount)}</div>
            <div class="detail-section">
                <div class="detail-section-title">운영비 정보</div>
                <div class="detail-grid">
                    <div class="detail-item-box"><div class="detail-item-label">지출일</div><div class="detail-item-value">${expense.date}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">카테고리</div><div class="detail-item-value">${expense.category}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">결제 수단</div><div class="detail-item-value">${expense.payMethod || '-'}</div></div>
                    <div class="detail-item-box"><div class="detail-item-label">금액</div><div class="detail-item-value" style="color:#f44336;font-weight:bold;">₩${formatNumber(expense.amount)}</div></div>
                </div>
            </div>
            <div class="detail-section">
                <div class="detail-section-title">운영비 내용</div>
                <div class="detail-full">${expense.description}</div>
            </div>
            ${expense.notes ? `<div class="detail-section"><div class="detail-section-title">비고</div><div class="detail-full">${expense.notes}</div></span></div>` : ''}
        `;

        // 버튼 이벤트
        const actionsEl = document.getElementById('expenseDetailActions');
        actionsEl.innerHTML = `
            <button class="btn-action btn-edit-action" id="editExpenseBtn">✏️ 수정</button>
            <button class="btn-action btn-delete-action" id="deleteExpenseBtn">🗑️ 삭제</button>`;

        document.getElementById('editExpenseBtn').addEventListener('click', function() {
            const idToEdit = currentExpenseDetailId;
            closeExpenseDetailModal();
            editExpense(idToEdit);
        });

        document.getElementById('deleteExpenseBtn').addEventListener('click', async function() {
            if (!confirm('정말 이 운영비를 삭제하시겠습니까?')) return;
            try {
                await db.collection('expenses').doc(currentExpenseDetailId).delete();
                alert('✅ 삭제되었습니다!');
                closeExpenseDetailModal();
            } catch (err) { alert('❌ 오류: ' + err.message); }
        });

        expenseDetailModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    };

    function closeExpenseDetailModal() {
        if (expenseDetailModal) {
            expenseDetailModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
        currentExpenseDetailId = null;
    }

    if (closeExpenseDetailBtn) {
        closeExpenseDetailBtn.addEventListener('click', closeExpenseDetailModal);
    }

    // 지출 수정
    function editExpense(id) {
        const expense = allExpenses.find(e => e.id === id);
        if (!expense) return;

        currentExpenseEditId = id;
        document.getElementById('expenseDate').value = expense.date || '';
        document.getElementById('expenseCategory').value = expense.category || '';
        document.getElementById('expenseDescription').value = expense.description || '';
        document.getElementById('expenseAmount').value = expense.amount || 0;
        document.getElementById('expensePayMethod').value = expense.payMethod || '카드';
        document.getElementById('expenseNotes').value = expense.notes || '';

        document.getElementById('expenseSubmitBtn').textContent = '✏️ 운영비 수정';
        openExpenseModal();
    }

    // ========================================
    // 거래명세서 / 견적서 기능
    // ========================================
    const invoiceFormModal = document.getElementById('invoiceFormModal');
    const closeInvoiceFormBtn = document.getElementById('closeInvoiceFormBtn');
    const invoicePreviewModal = document.getElementById('invoicePreviewModal');
    const closeInvoicePreviewBtn = document.getElementById('closeInvoicePreviewBtn');
    const closePreviewBtn2 = document.getElementById('closePreviewBtn2');
    let currentInvoiceTransactionId = null;

    // 명세서 작성 모달 열기
    function openInvoiceFormModal(transactionId) {
        const transaction = allTransactions.find(t => t.id === transactionId);
        if (!transaction) return;

        currentInvoiceTransactionId = transactionId;

        // 거래 데이터를 자동 채우기
        document.getElementById('invClientName').value = transaction.customerName || '';
        document.getElementById('invClientTel').value = transaction.phone || '';
        document.getElementById('invClientAddr').value = (transaction.location || '') + ' ' + (transaction.detailedLocation || '');

        // 품목 초기화 - 작업 내용을 첫번째 품목으로
        const container = document.getElementById('invoiceItemsContainer');
        container.innerHTML = '';
        addInvoiceItem(transaction.content || transaction.serviceType || '', 1, transaction.totalCost || 0);

        // 비고 - 기본값(계좌) + 거래 비고
        const defaultNotes = '계좌번호 : 국민 806801-01-334721 (변경남)';
        const txNotes = transaction.notes || '';
        document.getElementById('invNotes').value = txNotes ? defaultNotes + '\n' + txNotes : defaultNotes;

        invoiceFormModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeInvoiceFormModal() {
        if (invoiceFormModal) {
            invoiceFormModal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }
    }

    if (closeInvoiceFormBtn) {
        closeInvoiceFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeInvoiceFormModal();
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === invoiceFormModal) closeInvoiceFormModal();
        if (event.target === invoicePreviewModal) closeInvoicePreviewModal();
    });

    // 품목 추가
    let invoiceItemIdx = 0;
    function addInvoiceItem(name, qty, price) {
        const container = document.getElementById('invoiceItemsContainer');
        const row = document.createElement('div');
        row.className = 'invoice-item-row';
        row.dataset.idx = invoiceItemIdx++;
        row.innerHTML = `
            <button type="button" class="btn-remove-item" onclick="this.parentElement.remove()">✕</button>
            <div class="form-row">
                <div class="form-group" style="flex:3;">
                    <label>품목명</label>
                    <input type="text" class="inv-item-name" placeholder="품목명" value="${name || ''}">
                </div>
                <div class="form-group" style="flex:1;">
                    <label>수량</label>
                    <input type="number" class="inv-item-qty" value="${qty || 1}" min="1">
                </div>
                <div class="form-group" style="flex:2;">
                    <label>단가</label>
                    <input type="number" class="inv-item-price" min="0" value="${price || 0}">
                </div>
            </div>`;
        container.appendChild(row);
    }

    const addInvoiceItemBtn = document.getElementById('addInvoiceItemBtn');
    if (addInvoiceItemBtn) {
        addInvoiceItemBtn.addEventListener('click', function() {
            addInvoiceItem('', 1, 0);
        });
    }

    // 미리보기
    const previewInvoiceBtn = document.getElementById('previewInvoiceBtn');
    if (previewInvoiceBtn) {
        previewInvoiceBtn.addEventListener('click', function() {
            generateInvoicePreview();
        });
    }

    const STAMP_IMG = 'data:image/png;base64,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';

    function generateInvoicePreview() {
        const docType = document.querySelector('input[name="invoiceType"]:checked').value;
        const isEstimate = docType === '견적서';
        const typeCls = isEstimate ? 'estimate' : 'statement';
        const includeVat = document.getElementById('invIncludeVat').checked;

        // 공급자 정보
        const supplier = {
            name: document.getElementById('invSupplierName').value || '',
            ceo: document.getElementById('invSupplierCeo').value || '',
            addr: document.getElementById('invSupplierAddr').value || '',
            bizNo: document.getElementById('invSupplierBizNo').value || '',
            tel: document.getElementById('invSupplierTel').value || ''
        };

        // 공급받는자 정보
        const client = {
            name: document.getElementById('invClientName').value || '',
            tel: document.getElementById('invClientTel').value || '',
            addr: document.getElementById('invClientAddr').value || ''
        };

        // 품목 수집
        const itemRows = document.querySelectorAll('.invoice-item-row');
        const items = [];
        let grandTotal = 0;
        itemRows.forEach((row, idx) => {
            const name = row.querySelector('.inv-item-name').value || '';
            const qty = parseInt(row.querySelector('.inv-item-qty').value) || 0;
            const price = parseInt(row.querySelector('.inv-item-price').value) || 0;
            const amount = qty * price;
            if (name) {
                items.push({ no: idx + 1, name, qty, price, amount });
                grandTotal += amount;
            }
        });

        const notes = document.getElementById('invNotes').value || '';
        const today = new Date();
        const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
        const docNo = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${String(Math.floor(Math.random()*1000)).padStart(3,'0')}`;

        // VAT 계산: 현금가(grandTotal) 기준, 체크 시 10% 추가
        const supplyAmount = grandTotal; // 공급가 = 현금가 그대로
        const vat = includeVat ? Math.round(grandTotal * 0.1) : 0;
        const finalTotal = includeVat ? grandTotal + vat : grandTotal;

        // 빈 행 추가 (최소 5행)
        while (items.length < 5) {
            items.push({ no: '', name: '', qty: '', price: '', amount: '' });
        }

        const itemsHtml = items.map(item => `
            <tr>
                <td>${item.no}</td>
                <td>${item.name}</td>
                <td>${item.qty !== '' ? item.qty : ''}</td>
                <td>${item.price !== '' ? Number(item.price).toLocaleString() : ''}</td>
                <td>${item.amount !== '' ? Number(item.amount).toLocaleString() : ''}</td>
            </tr>
        `).join('');

        // 합계 tfoot
        const tfootHtml = includeVat
            ? `<tr>
                <td colspan="4" style="text-align:center;font-weight:bold;">공급가액</td>
                <td style="font-size:14px;">₩ ${supplyAmount.toLocaleString()}</td>
               </tr>
               <tr>
                <td colspan="4" style="text-align:center;font-weight:bold;">부가세 (10%)</td>
                <td style="font-size:14px;">₩ ${vat.toLocaleString()}</td>
               </tr>
               <tr style="background:#f0f0f0;">
                <td colspan="4" style="text-align:center;font-weight:bold;font-size:15px;">합 계</td>
                <td style="font-size:16px;font-weight:bold;">₩ ${finalTotal.toLocaleString()}</td>
               </tr>`
            : `<tr>
                <td colspan="4" style="text-align:center;font-weight:bold;">합 계</td>
                <td style="font-size:15px;">₩ ${grandTotal.toLocaleString()}</td>
               </tr>`;

        // 총 금액 행
        const totalRowHtml = includeVat
            ? `총 금액 : ₩ ${finalTotal.toLocaleString()}`
            : `총 금액 : ₩ ${grandTotal.toLocaleString()}`;

        const html = `
            <div class="invoice-doc" id="invoiceDocContent">
                <div class="invoice-doc-title ${typeCls}">${docType}</div>
                <div class="invoice-doc-no">No. ${docNo} &nbsp;|&nbsp; ${dateStr}</div>

                <div style="display:flex;gap:15px;margin-bottom:20px;">
                    <div style="flex:1;">
                        <table class="invoice-info-table">
                            <tr><th colspan="2" style="text-align:center;background:${isEstimate ? '#fff3e0' : '#e3f2fd'};">공급자</th></tr>
                            <tr><th>상 호</th><td>${supplier.name}</td></tr>
                            <tr><th>대표자</th><td style="position:relative;">${supplier.ceo}<span style="position:absolute;right:30px;top:50%;transform:translateY(-50%);display:inline-block;color:#ccc;">(인)<img src="${STAMP_IMG}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80px;height:auto;opacity:1;" alt="직인"></span></td></tr>
                            <tr><th>사업자번호</th><td>${supplier.bizNo}</td></tr>
                            <tr><th>주 소</th><td>${supplier.addr}</td></tr>
                            <tr><th>연락처</th><td>${supplier.tel}</td></tr>
                        </table>
                    </div>
                    <div style="flex:1;">
                        <table class="invoice-info-table">
                            <tr><th colspan="2" style="text-align:center;background:#f5f5f5;">공급받는자</th></tr>
                            <tr><th>상호(이름)</th><td style="position:relative;">${client.name}<span style="position:absolute;right:30px;top:50%;transform:translateY(-50%);color:#ccc;">(인)</span></td></tr>
                            <tr><th>연락처</th><td>${client.tel}</td></tr>
                            <tr><th>주 소</th><td>${client.addr}</td></tr>
                            <tr><th colspan="2" style="text-align:center;padding:14px;font-size:12px;color:#999;">아래와 같이 ${isEstimate ? '견적' : '거래 내역을 명세'}합니다.</th></tr>
                            <tr><th></th><td></td></tr>
                        </table>
                    </div>
                </div>

                <table class="invoice-items-table ${typeCls}">
                    <thead>
                        <tr>
                            <th style="width:40px;">No</th>
                            <th>품 목</th>
                            <th style="width:60px;">수량</th>
                            <th style="width:100px;">단가</th>
                            <th style="width:120px;">금액</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>${tfootHtml}</tfoot>
                </table>

                <div class="invoice-total-row">${totalRowHtml}</div>

                ${notes ? `<div class="invoice-notes"><strong>비고</strong><br><span style="font-size:15px;font-weight:700;color:#333;">${notes.replace(/\n/g, '<br>')}</span></div>` : ''}
            </div>
        `;

        document.getElementById('invoicePreviewArea').innerHTML = html;

        // 모바일에서 PC와 동일한 레이아웃으로 축소 표시
        if (window.innerWidth < 768) {
            const previewArea = document.getElementById('invoicePreviewArea');
            const docEl = document.getElementById('invoiceDocContent');
            if (docEl) {
                const areaWidth = previewArea.clientWidth - 20;
                const docWidth = 720;
                const scale = Math.min(1, areaWidth / docWidth);
                docEl.style.width = docWidth + 'px';
                docEl.style.minWidth = docWidth + 'px';
                docEl.style.transform = `scale(${scale})`;
                docEl.style.transformOrigin = 'top left';
                // 축소된 높이에 맞춰 컨테이너 조정
                setTimeout(() => {
                    const scaledHeight = docEl.offsetHeight * scale;
                    previewArea.style.height = (scaledHeight + 20) + 'px';
                }, 100);
            }
        }

        // 작성 모달 숨기고 미리보기 열기 (닫지 않음)
        invoiceFormModal.classList.remove('show');
        invoicePreviewModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeInvoicePreviewModal() {
        if (invoicePreviewModal) {
            invoicePreviewModal.classList.remove('show');
            // 작성 모달 다시 보이기
            invoiceFormModal.classList.add('show');
            document.body.style.overflow = 'auto';
        }
    }

    if (closeInvoicePreviewBtn) {
        closeInvoicePreviewBtn.addEventListener('click', function(e) { e.preventDefault(); closeInvoicePreviewModal(); });
    }
    if (closePreviewBtn2) {
        closePreviewBtn2.addEventListener('click', function(e) { e.preventDefault(); closeInvoicePreviewModal(); });
    }

    // 인쇄
    const printInvoiceBtn = document.getElementById('printInvoiceBtn');
    if (printInvoiceBtn) {
        printInvoiceBtn.addEventListener('click', function() {
            const content = document.getElementById('invoiceDocContent');
            if (!content) return;

            const printWin = window.open('', '_blank', 'width=800,height=1000');
            printWin.document.write(`
                <html><head><title>인쇄</title>
                <style>
                    body { margin: 0; padding: 20px; font-family: 'Malgun Gothic','맑은 고딕',sans-serif; }
                    ${getInvoicePrintCSS()}
                </style></head>
                <body>${content.outerHTML}</body></html>
            `);
            printWin.document.close();
            printWin.focus();
            setTimeout(() => { printWin.print(); printWin.close(); }, 300);
        });
    }

    function getInvoicePrintCSS() {
        return `
            .invoice-doc { max-width:100%; padding:20px; }
            .invoice-doc-title { text-align:center; font-size:28px; font-weight:bold; letter-spacing:8px; padding-bottom:15px; border-bottom:3px double #333; margin-bottom:25px; }
            .invoice-doc-title.estimate { color:#e65100; border-bottom-color:#e65100; }
            .invoice-doc-title.statement { color:#1565C0; border-bottom-color:#1565C0; }
            .invoice-doc-no { text-align:right; font-size:12px; color:#666; margin-bottom:20px; }
            .invoice-info-table { width:100%; border-collapse:collapse; font-size:13px; }
            .invoice-info-table th { background:#f5f5f5; padding:8px 10px; text-align:left; font-weight:600; border:1px solid #ddd; width:75px; min-width:75px; max-width:75px; white-space:nowrap; }
            .invoice-info-table td { padding:8px 10px; border:1px solid #ddd; word-break:break-all; }
            .invoice-items-table { width:100%; border-collapse:collapse; font-size:13px; }
            .invoice-items-table thead th { background:#37474f; color:white; padding:10px 8px; text-align:center; border:1px solid #37474f; }
            .invoice-items-table.estimate thead th { background:#e65100; border-color:#e65100; }
            .invoice-items-table.statement thead th { background:#1565C0; border-color:#1565C0; }
            .invoice-items-table tbody td { padding:9px 8px; border:1px solid #ddd; text-align:center; }
            .invoice-items-table tbody td:nth-child(2) { text-align:left; }
            .invoice-items-table tfoot td { padding:12px 8px; border:1px solid #ddd; font-weight:bold; text-align:center; background:#fafafa; }
            .invoice-total-row { font-size:16px; text-align:right; padding:15px 0; font-weight:bold; border-top:2px solid #333; border-bottom:2px solid #333; margin-bottom:20px; }
            .invoice-notes { background:#f9f9f9; padding:15px; border-radius:5px; font-size:12px; color:#555; line-height:1.8; white-space:pre-wrap; margin-bottom:20px; }
            .invoice-footer { display:flex; justify-content:space-between; margin-top:40px; font-size:13px; }
            .invoice-stamp-area { text-align:center; width:200px; }
            .invoice-stamp-area img { width:120px; height:auto; margin-bottom:5px; }
            .invoice-stamp-area .stamp-label { padding-top:10px; border-top:1px solid #333; font-weight:600; }
        `;
    }

    // 이미지 저장
    const saveInvoiceImgBtn = document.getElementById('saveInvoiceImgBtn');
    if (saveInvoiceImgBtn) {
        saveInvoiceImgBtn.addEventListener('click', async function() {
            const target = document.getElementById('invoiceDocContent');
            if (!target || typeof html2canvas === 'undefined') {
                alert('이미지 저장 기능을 사용할 수 없습니다.');
                return;
            }

            saveInvoiceImgBtn.disabled = true;
            saveInvoiceImgBtn.textContent = '⏳ 생성중...';

            try {
                // PC와 동일한 레이아웃으로 캡처하기 위해 숨겨진 고정폭 컨테이너 사용
                const offscreen = document.createElement('div');
                offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;z-index:-1;background:white;';
                offscreen.innerHTML = target.outerHTML;
                document.body.appendChild(offscreen);

                // 스타일 재적용 (인라인 스타일은 복제되지만 클래스 스타일 보강)
                const style = document.createElement('style');
                style.textContent = getInvoicePrintCSS() + `
                    .invoice-doc { width:760px; padding:30px 20px; font-family:'Malgun Gothic','맑은 고딕',sans-serif; box-sizing:border-box; }
                    .invoice-doc * { box-sizing:border-box; }
                    .invoice-info-table { table-layout:auto; width:100%; }
                    .invoice-info-table th { width:75px !important; min-width:75px; max-width:75px; white-space:nowrap; font-size:12px; padding:7px 8px; }
                    .invoice-info-table td { width:auto; font-size:12px; padding:7px 8px; word-break:break-all; }
                    .invoice-items-table { table-layout:auto; width:100%; }
                    .invoice-stamp-area { position:relative; }
                    .invoice-stamp-area img { width:110px;height:auto;opacity:1; }
                `;
                offscreen.appendChild(style);

                const canvas = await html2canvas(offscreen, {
                    scale: 4,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: 800,
                    windowWidth: 800
                });

                document.body.removeChild(offscreen);

                const docType = document.querySelector('input[name="invoiceType"]:checked').value;
                const clientName = document.getElementById('invClientName').value || '고객';
                const today = new Date().toISOString().split('T')[0];
                const fileName = `${docType}_${clientName}_${today}.png`;

                // 모바일: Web Share API로 바로 사진 공유/저장
                if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                    canvas.toBlob(async function(blob) {
                        try {
                            const file = new File([blob], fileName, { type: 'image/png' });
                            await navigator.share({
                                files: [file],
                                title: fileName
                            });
                        } catch (shareErr) {
                            // 공유 취소 또는 미지원 시 다운로드 폴백
                            downloadCanvas(canvas, fileName);
                        }
                    }, 'image/png');
                } else {
                    // PC: 기존 다운로드 방식
                    downloadCanvas(canvas, fileName);
                }

            } catch (err) {
                alert('이미지 생성 중 오류: ' + err.message);
            } finally {
                saveInvoiceImgBtn.disabled = false;
                saveInvoiceImgBtn.textContent = '📷 이미지 저장';
            }
        });
    }

    function downloadCanvas(canvas, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // ========================================
    // 명세서 저장/목록/불러오기
    // ========================================
    // 명세서 Firebase 저장
    const saveInvoiceToDbBtn = document.getElementById('saveInvoiceToDbBtn');
    if (saveInvoiceToDbBtn) {
        saveInvoiceToDbBtn.addEventListener('click', async function() {
            const docType = document.querySelector('input[name="invoiceType"]:checked').value;
            const includeVat = document.getElementById('invIncludeVat').checked;

            const supplier = {
                name: document.getElementById('invSupplierName').value || '',
                ceo: document.getElementById('invSupplierCeo').value || '',
                addr: document.getElementById('invSupplierAddr').value || '',
                bizNo: document.getElementById('invSupplierBizNo').value || '',
                tel: document.getElementById('invSupplierTel').value || ''
            };
            const client = {
                name: document.getElementById('invClientName').value || '',
                tel: document.getElementById('invClientTel').value || '',
                addr: document.getElementById('invClientAddr').value || ''
            };

            const itemRows = document.querySelectorAll('.invoice-item-row');
            const items = [];
            let grandTotal = 0;
            itemRows.forEach((row) => {
                const name = row.querySelector('.inv-item-name').value || '';
                const qty = parseInt(row.querySelector('.inv-item-qty').value) || 0;
                const price = parseInt(row.querySelector('.inv-item-price').value) || 0;
                const amount = qty * price;
                if (name) {
                    items.push({ name, qty, price, amount });
                    grandTotal += amount;
                }
            });

            const notes = document.getElementById('invNotes').value || '';
            const vat = includeVat ? Math.round(grandTotal * 0.1) : 0;
            const finalTotal = includeVat ? grandTotal + vat : grandTotal;

            const invoiceData = {
                docType,
                includeVat,
                supplier,
                client,
                items,
                grandTotal,
                vat,
                finalTotal,
                notes,
                transactionId: currentInvoiceTransactionId || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('invoices').add(invoiceData);
                alert('명세서가 저장되었습니다.');
            } catch (err) {
                alert('저장 실패: ' + err.message);
            }
        });
    }

    // 저장목록 모달
    const invoiceListModal = document.getElementById('invoiceListModal');
    const showInvoiceListBtn = document.getElementById('showInvoiceListBtn');
    const closeInvoiceListBtn = document.getElementById('closeInvoiceListBtn');

    if (showInvoiceListBtn) {
        showInvoiceListBtn.addEventListener('click', function() {
            loadInvoiceList();
            invoiceFormModal.classList.remove('show');
            invoiceListModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        });
    }
    if (closeInvoiceListBtn) {
        closeInvoiceListBtn.addEventListener('click', function() {
            invoiceListModal.classList.remove('show');
            invoiceFormModal.classList.add('show');
        });
    }
    window.addEventListener('click', function(e) {
        if (e.target === invoiceListModal) {
            invoiceListModal.classList.remove('show');
            invoiceFormModal.classList.add('show');
        }
    });

    // 목록 불러오기
    async function loadInvoiceList() {
        const container = document.getElementById('invoiceListContainer');
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#999;">불러오는 중...</div>';

        try {
            const snapshot = await db.collection('invoices').orderBy('createdAt', 'desc').limit(50).get();
            if (snapshot.empty) {
                container.innerHTML = '<div class="invoice-list-empty">저장된 명세서가 없습니다.</div>';
                return;
            }

            let html = '';
            snapshot.forEach(doc => {
                const d = doc.data();
                const date = d.createdAt ? d.createdAt.toDate() : new Date();
                const dateStr = `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}`;
                const typeCls = d.docType === '견적서' ? 'estimate' : 'statement';
                const total = (d.finalTotal || d.grandTotal || 0).toLocaleString();
                const clientName = d.client?.name || '미지정';
                const itemSummary = d.items?.length ? d.items[0].name + (d.items.length > 1 ? ` 외 ${d.items.length - 1}건` : '') : '';

                html += `
                <div class="invoice-list-item" data-id="${doc.id}">
                    <div class="invoice-list-info">
                        <div class="inv-title">${clientName}<span class="invoice-list-badge ${typeCls}">${d.docType}</span></div>
                        <div class="inv-meta">${dateStr} · ${itemSummary}</div>
                    </div>
                    <div class="invoice-list-amount">₩${total}</div>
                    <div class="invoice-list-actions">
                        <button class="inv-btn-load" onclick="loadSavedInvoice('${doc.id}')">불러오기</button>
                        <button class="inv-btn-delete" onclick="deleteSavedInvoice('${doc.id}')">삭제</button>
                    </div>
                </div>`;
            });
            container.innerHTML = html;
        } catch (err) {
            container.innerHTML = '<div class="invoice-list-empty">불러오기 실패: ' + err.message + '</div>';
        }
    }

    // 저장된 명세서 불러오기
    window.loadSavedInvoice = async function(docId) {
        try {
            const doc = await db.collection('invoices').doc(docId).get();
            if (!doc.exists) { alert('명세서를 찾을 수 없습니다.'); return; }
            const d = doc.data();

            // 문서 유형
            document.querySelectorAll('input[name="invoiceType"]').forEach(r => {
                r.checked = (r.value === d.docType);
            });

            // 부가세
            document.getElementById('invIncludeVat').checked = d.includeVat || false;

            // 공급자
            if (d.supplier) {
                document.getElementById('invSupplierName').value = d.supplier.name || '';
                document.getElementById('invSupplierCeo').value = d.supplier.ceo || '';
                document.getElementById('invSupplierAddr').value = d.supplier.addr || '';
                document.getElementById('invSupplierBizNo').value = d.supplier.bizNo || '';
                document.getElementById('invSupplierTel').value = d.supplier.tel || '';
            }

            // 고객
            if (d.client) {
                document.getElementById('invClientName').value = d.client.name || '';
                document.getElementById('invClientTel').value = d.client.tel || '';
                document.getElementById('invClientAddr').value = d.client.addr || '';
            }

            // 품목
            const container = document.getElementById('invoiceItemsContainer');
            container.innerHTML = '';
            if (d.items && d.items.length > 0) {
                d.items.forEach(item => {
                    addInvoiceItem(item.name, item.qty, item.price);
                });
            } else {
                addInvoiceItem('', 1, 0);
            }

            // 비고
            document.getElementById('invNotes').value = d.notes || '';

            // 거래 ID
            currentInvoiceTransactionId = d.transactionId || null;

            // 목록 모달 닫고 작성 모달 열기
            invoiceListModal.classList.remove('show');
            invoiceFormModal.classList.add('show');

        } catch (err) {
            alert('불러오기 실패: ' + err.message);
        }
    };

    // 저장된 명세서 삭제
    window.deleteSavedInvoice = async function(docId) {
        if (!confirm('이 명세서를 삭제하시겠습니까?')) return;
        try {
            await db.collection('invoices').doc(docId).delete();
            loadInvoiceList();
        } catch (err) {
            alert('삭제 실패: ' + err.message);
        }
    };
    console.log('앱 초기화 시작...');
    setDefaultDate();
    loadTransactions();
    loadSchedules();
    loadExpenses();
    
    // 지출 기본 날짜
    const eDateInput = document.getElementById('expenseDate');
    if (eDateInput) eDateInput.valueAsDate = new Date();
    
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
    const expenses = labels.map(month => data[month].expense || 0);
    const netProfits = labels.map(month => data[month].netProfit || 0);
    
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
                },
                {
                    label: '운영비',
                    data: expenses,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 2,
                    pointRadius: 5,
                    pointBackgroundColor: 'rgba(244, 67, 54, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: '실순이익',
                    data: netProfits,
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    borderColor: 'rgba(255, 152, 0, 1)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointBackgroundColor: 'rgba(255, 152, 0, 1)',
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
                    text: '월별 매출·순이익·운영비·실순이익 추이 (최근 12개월)',
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