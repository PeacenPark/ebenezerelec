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

// ========================================
// DOM이 로드된 후 실행
// ========================================
console.log('DOMContentLoaded 리스너 등록 중...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM 로드 완료 ===');
    
    // DOM 요소
    const form = document.getElementById('transactionForm');
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
    // 날짜 설정
    // ========================================
    function setDefaultDate() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
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
    }
    
    // ========================================
    // 폼 제출 처리
    // ========================================
    async function handleFormSubmit(e) {
        e.preventDefault();
        console.log('폼 제출');
    
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
            totalCost: parseInt(document.getElementById('totalCost').value),
            materialCost: parseInt(document.getElementById('materialCost').value),
            laborCost: parseInt(document.getElementById('laborCost').value),
            profit: parseInt(document.getElementById('profit').value),
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };
    
        try {
            if (currentEditId) {
                await db.collection('transactions').doc(currentEditId).update(transactionData);
                alert('✅ 거래 내역이 수정되었습니다!');
                currentEditId = null;
                document.getElementById('submitBtn').textContent = '✅ 거래 내역 저장';
            } else {
                await db.collection('transactions').add(transactionData);
                alert('✅ 거래 내역이 저장되었습니다!');
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
        const totalCount = transactions.length;
        const totalRevenue = transactions.reduce((sum, t) => sum + t.totalCost, 0);
        const totalMaterialCost = transactions.reduce((sum, t) => sum + t.materialCost, 0);
        const totalProfit = transactions.reduce((sum, t) => sum + t.profit, 0);
    
        document.getElementById('totalCount').textContent = totalCount;
        document.getElementById('totalRevenue').textContent = '₩' + formatNumber(totalRevenue);
        document.getElementById('totalMaterialCost').textContent = '₩' + formatNumber(totalMaterialCost);
        document.getElementById('totalProfit').textContent = '₩' + formatNumber(totalProfit);
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
            monthlyData[month].totalRevenue += t.totalCost;
            monthlyData[month].materialCost += t.materialCost;
            monthlyData[month].laborCost += t.laborCost;
            monthlyData[month].profit += t.profit;
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
            locationData[t.location].totalRevenue += t.totalCost;
            totalRevenue += t.totalCost;
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
            serviceData[t.serviceType].totalRevenue += t.totalCost;
            totalRevenue += t.totalCost;
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
            referralData[source].totalRevenue += t.totalCost;
            totalRevenue += t.totalCost;
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
    // 초기화
    // ========================================
    console.log('앱 초기화 시작...');
    setDefaultDate();
    loadTransactions();
    
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

// 월별 차트 생성 (막대 그래프)
function createMonthlyChart(months, data) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    const labels = [...months].reverse(); // 오래된 순으로
    const revenues = labels.map(month => data[month].totalRevenue);
    const materialCosts = labels.map(month => data[month].materialCost);
    const laborCosts = labels.map(month => data[month].laborCost);
    const profits = labels.map(month => data[month].profit);
    
    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '총 매출',
                    data: revenues,
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                },
                {
                    label: '자재비',
                    data: materialCosts,
                    backgroundColor: 'rgba(255, 152, 0, 0.7)',
                    borderColor: 'rgba(255, 152, 0, 1)',
                    borderWidth: 2
                },
                {
                    label: '인부 비용',
                    data: laborCosts,
                    backgroundColor: 'rgba(233, 30, 99, 0.7)',
                    borderColor: 'rgba(233, 30, 99, 1)',
                    borderWidth: 2
                },
                {
                    label: '순이익',
                    data: profits,
                    backgroundColor: 'rgba(76, 175, 80, 0.7)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2
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
                    position: 'top'
                },
                title: {
                    display: true,
                    text: '월별 매출 및 비용 구성 분석',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
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
                        text: '금액 (원)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₩' + (value / 10000).toFixed(0) + '만';
                        }
                    }
                }
            }
        }
    });
}

// 지역별 차트 생성 (도넛 차트)
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
                label: '매출액',
                data: locations.map(loc => data[loc].totalRevenue),
                backgroundColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                title: {
                    display: true,
                    text: '지역별 매출 분포',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ₩' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// 서비스별 차트 생성 (가로 막대 그래프)
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
                label: '매출액',
                data: services.map(service => data[service].totalRevenue),
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
                    text: '서비스별 매출',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return '매출: ₩' + context.parsed.x.toLocaleString();
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₩' + (value / 10000).toFixed(0) + '만';
                        }
                    }
                }
            }
        }
    });
}

// 유입 경로별 차트 생성 (파이 차트)
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
                label: '매출액',
                data: referrals.map(ref => data[ref].totalRevenue),
                backgroundColor: colors,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'right'
                },
                title: {
                    display: true,
                    text: '유입 경로별 매출 분포',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ₩' + value.toLocaleString() + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

