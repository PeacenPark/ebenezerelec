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
let currentDisplayedTransactions = [];
let currentSortBy = 'date';
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

        // 정렬 기준 적용
        const sortBy = currentSortBy || 'date';
        
        // 정산일순: 미수금 제외 / 미수금: 미수금만
        let filtered;
        if (sortBy === 'paidDate') {
            filtered = transactions.filter(t => t.paymentStatus !== 'unpaid');
        } else if (sortBy === 'unpaid') {
            filtered = transactions.filter(t => t.paymentStatus === 'unpaid');
        } else {
            filtered = transactions;
        }

        const sorted = [...filtered].sort((a, b) => {
            const dateA = sortBy === 'paidDate' ? (a.paidDate || a.date) : a.date;
            const dateB = sortBy === 'paidDate' ? (b.paidDate || b.date) : b.date;
            return dateB.localeCompare(dateA);
        });
    
        currentDisplayedTransactions = sorted;
        listElement.innerHTML = sorted.map(transaction => createTransactionHTML(transaction)).join('');
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

        const paidDateLine = (!isUnpaid && transaction.paidDate) 
            ? `<div class="transaction-date" style="font-size:11px;color:#4CAF50;">💰 ${transaction.paidDate}</div>` 
            : '';

        return `
            <div class="${itemClass}" data-id="${transaction.id}">
                <div class="transaction-header">
                    <div class="customer-name">👤 ${transaction.customerName} ${paymentBadge}</div>
                    <div style="text-align:right;">
                        <div class="transaction-date">📅 ${transaction.date}</div>
                        ${paidDateLine}
                    </div>
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
    
        const filter = e.target.dataset.filter;
        currentSortBy = filter;

        // 월별 선택이 되어있으면 그 범위 내에서 필터
        const monthFilterEl = document.getElementById('monthFilter');
        const selectedMonth = monthFilterEl ? monthFilterEl.value : '';

        let filtered = allTransactions;

        // 월별 선택 적용
        if (selectedMonth) {
            filtered = filtered.filter(t => {
                const targetDate = currentSortBy === 'paidDate' ? (t.paidDate || t.date) : t.date;
                return targetDate.startsWith(selectedMonth);
            });
        }

        // 버튼 필터 적용
        if (filter === 'paidDate') {
            filtered = filtered.filter(t => t.paymentStatus !== 'unpaid');
        } else if (filter === 'unpaid') {
            filtered = filtered.filter(t => t.paymentStatus === 'unpaid');
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
            // 미수금은 통계에서 제외
            if (t.paymentStatus === 'unpaid') return;

            // 정산완료: paidDate가 있으면 그 날짜 기준, 없으면 거래일 기준(기존 데이터 호환)
            const statsDate = t.paidDate || t.date;
            const month = statsDate.substring(0, 7);

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
            if (t.paymentStatus === 'unpaid') return;
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
            if (t.paymentStatus === 'unpaid') return;
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
            if (t.paymentStatus === 'unpaid') return;
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
            
            // 버튼 활성화 상태 유지 (비활성화하지 않음)
            // 활성 버튼 없으면 거래일을 기본으로
            const activeBtn = document.querySelector('.filter-btn.active');
            if (!activeBtn) {
                const dateBtn = document.querySelector('.filter-btn[data-filter="date"]');
                if (dateBtn) dateBtn.classList.add('active');
                currentSortBy = 'date';
            }
            
            if (selectedMonth) {
                const filtered = allTransactions.filter(t => {
                    const targetDate = currentSortBy === 'paidDate' ? (t.paidDate || t.date) : t.date;
                    return targetDate.startsWith(selectedMonth);
                });
                displayTransactions(filtered);
                updateStatistics(filtered);
            } else {
                displayTransactions(allTransactions);
                updateStatistics(allTransactions);
            }
        });
    }

    
    
    
    // 엑셀 저장
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            const data = currentDisplayedTransactions;
            if (!data || data.length === 0) {
                alert('저장할 거래 내역이 없습니다.');
                return;
            }

            const rows = data.map(t => ({
                '거래일': t.date,
                '정산일': t.paidDate || '',
                '결제상태': t.paymentStatus === 'unpaid' ? '미수금' : '정산완료',
                '고객명': t.customerName,
                '연락처': t.phone,
                '지역': t.location,
                '서비스': t.serviceType,
                '유입경로': t.referralSource || '',
                '총비용': t.totalCost || 0,
                '자재비': t.materialCost || 0,
                '인건비': t.laborCost || 0,
                '순이익': t.profit || 0,
                '작업내용': t.description || ''
            }));

            const ws = XLSX.utils.json_to_sheet(rows);

            // 열 너비 설정
            ws['!cols'] = [
                {wch:12},{wch:12},{wch:10},{wch:12},{wch:15},
                {wch:10},{wch:14},{wch:10},{wch:12},{wch:12},
                {wch:12},{wch:12},{wch:30}
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '거래내역');

            const today = new Date();
            const fileName = `거래내역_${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}.xlsx`;
            XLSX.writeFile(wb, fileName);
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
                        : `<span class="paid-badge" style="font-size:1em;padding:8px 20px;">💰 정산완료</span>
                           <div style="margin-top:8px;font-size:13px;color:#888;">정산일: <input type="date" id="paidDateEdit" value="${transaction.paidDate || transaction.date}" style="border:1px solid #ddd;border-radius:4px;padding:2px 6px;font-size:13px;color:#555;"> <button id="paidDateSaveBtn" style="padding:2px 8px;font-size:12px;border:1px solid #4CAF50;background:#4CAF50;color:white;border-radius:4px;cursor:pointer;">저장</button></div>`}
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
                const today = new Date();
                const defaultDate = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
                const paidDate = prompt('정산일을 입력하세요 (YYYY-MM-DD):', defaultDate);
                if (!paidDate) return;
                if (!/^\d{4}-\d{2}-\d{2}$/.test(paidDate)) {
                    alert('날짜 형식이 올바르지 않습니다. (예: 2025-03-01)');
                    return;
                }
                try {
                    await db.collection('transactions').doc(currentDetailId).update({ paymentStatus: 'paid', paidDate: paidDate });
                    alert('💰 정산완료 처리되었습니다! (' + paidDate + ')');
                    closeDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }
        
        // 미수금으로 변경 버튼
        const markUnpaidBtn = document.getElementById('markUnpaidBtn');
        if (markUnpaidBtn) {
            markUnpaidBtn.addEventListener('click', async function() {
                try {
                    await db.collection('transactions').doc(currentDetailId).update({ paymentStatus: 'unpaid', paidDate: firebase.firestore.FieldValue.delete() });
                    alert('🔴 미수금으로 변경되었습니다.');
                    closeDetailModal();
                } catch (err) { alert('❌ 오류: ' + err.message); }
            });
        }

        // 정산일 수정 저장 버튼
        const paidDateSaveBtn = document.getElementById('paidDateSaveBtn');
        if (paidDateSaveBtn) {
            paidDateSaveBtn.addEventListener('click', async function() {
                const newDate = document.getElementById('paidDateEdit').value;
                if (!newDate) { alert('날짜를 선택하세요.'); return; }
                try {
                    await db.collection('transactions').doc(currentDetailId).update({ paidDate: newDate });
                    alert('정산일이 ' + newDate + '로 변경되었습니다.');
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
        const docNo = `${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*10)+1}`;

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
                            <tr><th>대표자</th><td style="position:relative;">${supplier.ceo}<span style="position:absolute;right:30px;top:50%;transform:translateY(-50%);display:inline-block;color:#ccc;">(인)<img src="${STAMP_IMG}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:38px;height:38px;opacity:1;" alt="직인"></span></td></tr>
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

        // 작성 모달 숨기고 미리보기 열기 (닫지 않음)
        invoiceFormModal.classList.remove('show');
        invoicePreviewModal.classList.add('show');
        document.body.style.overflow = 'hidden';

        // 모바일에서 PC와 동일한 레이아웃으로 축소 표시 (모달 열린 후 실행)
        if (window.innerWidth < 768) {
            setTimeout(() => {
                const previewArea = document.getElementById('invoicePreviewArea');
                const docEl = document.getElementById('invoiceDocContent');
                if (docEl && previewArea) {
                    const areaWidth = previewArea.clientWidth;
                    const docWidth = 720;
                    const scale = Math.min(1, areaWidth / docWidth);
                    docEl.style.width = docWidth + 'px';
                    docEl.style.minWidth = docWidth + 'px';
                    docEl.style.transform = `scale(${scale})`;
                    docEl.style.transformOrigin = 'top left';
                    // 래퍼로 실제 차지 영역을 축소 크기에 맞춤
                    const wrapper = document.createElement('div');
                    wrapper.style.width = (docWidth * scale) + 'px';
                    wrapper.style.height = (docEl.offsetHeight * scale) + 'px';
                    wrapper.style.overflow = 'hidden';
                    docEl.parentNode.insertBefore(wrapper, docEl);
                    wrapper.appendChild(docEl);
                }
            }, 50);
        }
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
                const offscreen = document.createElement('div');
                offscreen.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;background:white;display:inline-block;';
                offscreen.innerHTML = target.outerHTML;
                document.body.appendChild(offscreen);

                // 모바일 축소용 인라인 스타일 제거
                const docEl = offscreen.querySelector('.invoice-doc');
                if (docEl) {
                    docEl.style.cssText = '';
                    docEl.style.width = '700px';
                    docEl.style.background = 'white';
                    docEl.style.padding = '30px 25px';
                    docEl.style.fontFamily = "'Malgun Gothic','맑은 고딕',sans-serif";
                    docEl.style.color = '#333';
                    docEl.style.lineHeight = '1.6';
                    docEl.style.boxSizing = 'border-box';
                }

                const style = document.createElement('style');
                style.textContent = getInvoicePrintCSS() + `
                    .invoice-doc * { box-sizing:border-box; }
                    .invoice-info-table { table-layout:auto; width:100%; }
                    .invoice-info-table th { width:75px !important; min-width:75px; max-width:75px; white-space:nowrap; font-size:12px; padding:7px 8px; }
                    .invoice-info-table td { width:auto; font-size:12px; padding:7px 8px; word-break:break-all; }
                    .invoice-items-table { table-layout:auto; width:100%; }
                    .invoice-stamp-area { position:relative; }
                    .invoice-stamp-area img { width:110px;height:auto;opacity:1; }
                `;
                offscreen.appendChild(style);

                const captureTarget = docEl || offscreen;
                const canvas = await html2canvas(captureTarget, {
                    scale: 4,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                });

                document.body.removeChild(offscreen);

                // canvas 여백 트림
                const trimmedCanvas = trimCanvas(canvas);

                const docType = document.querySelector('input[name="invoiceType"]:checked').value;
                const clientName = document.getElementById('invClientName').value || '고객';
                const today = new Date().toISOString().split('T')[0];
                const fileName = `${docType}_${clientName}_${today}.png`;

                // 모바일: Web Share API로 바로 사진 공유/저장
                if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
                    trimmedCanvas.toBlob(async function(blob) {
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
                    downloadCanvas(trimmedCanvas, fileName);
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

    // 흰색 여백 트림
    function trimCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        let top = h, bottom = 0, left = w, right = 0;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const r = data[i], g = data[i+1], b = data[i+2];
                // 흰색이 아닌 픽셀 감지 (250 이하)
                if (r < 250 || g < 250 || b < 250) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                    if (x < left) left = x;
                    if (x > right) right = x;
                }
            }
        }

        if (top >= bottom || left >= right) return canvas;

        // 내용만 정확히 잘라내기
        const trimW = right - left + 1;
        const trimH = bottom - top + 1;

        // A4 비율 (1 : 1.414)
        const a4Ratio = 1.414;
        const pad = 150;
        const contentW = trimW + pad * 2;
        const contentH = trimH + pad * 2;

        let finalW, finalH;
        if (contentH / contentW > a4Ratio) {
            // 세로가 더 긴 경우 → 세로 기준으로 가로 맞춤
            finalH = contentH;
            finalW = Math.round(finalH / a4Ratio);
        } else {
            // 가로가 더 넓은 경우 → 가로 기준으로 세로 맞춤
            finalW = contentW;
            finalH = Math.round(finalW * a4Ratio);
        }

        const trimmed = document.createElement('canvas');
        trimmed.width = finalW;
        trimmed.height = finalH;
        const tCtx = trimmed.getContext('2d');
        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, finalW, finalH);
        // 내용을 상단 중앙에 배치
        const offsetX = Math.round((finalW - trimW) / 2);
        const offsetY = pad;
        tCtx.drawImage(canvas, left, top, trimW, trimH, offsetX, offsetY, trimW, trimH);
        return trimmed;
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