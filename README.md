# 에벤에셀 전기 거래 장부 시스템

## 📁 파일 구조

```
/
├── index.html      # 메인 HTML 파일
├── styles.css      # 스타일시트
├── app.js          # JavaScript 로직
└── README.md       # 이 파일
```

## 🚀 시작하기

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: "ebenezer-electric")
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

### 2. Firestore Database 설정

1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. "테스트 모드에서 시작" 선택 (개발 시)
4. 위치 선택: `asia-northeast3 (서울)` 추천
5. "사용 설정" 클릭

### 3. 웹 앱 추가 및 설정 정보 받기

1. Firebase Console에서 프로젝트 설정 (⚙️) 클릭
2. "내 앱"에서 웹 아이콘 (</>) 클릭
3. 앱 닉네임 입력 (예: "거래장부 웹앱")
4. "Firebase Hosting 설정" 체크 해제
5. "앱 등록" 클릭
6. Firebase SDK 설정 정보 복사

### 4. app.js 파일 수정

`app.js` 파일의 다음 부분을 복사한 설정 정보로 교체:

```javascript
const firebaseConfig = {
    apiKey: "복사한_API_KEY",
    authDomain: "복사한_AUTH_DOMAIN",
    projectId: "복사한_PROJECT_ID",
    storageBucket: "복사한_STORAGE_BUCKET",
    messagingSenderId: "복사한_MESSAGING_SENDER_ID",
    appId: "복사한_APP_ID"
};
```

### 5. 보안 규칙 설정 (중요!)

Firestore Database → 규칙 탭에서 다음과 같이 설정:

**개발 단계 (테스트용)**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**운영 단계 (보안 강화)**:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. 로컬에서 실행

파일들을 같은 폴더에 저장한 후:

**방법 1: Live Server (VS Code 확장)**
1. VS Code에서 Live Server 확장 설치
2. index.html 파일에서 우클릭 → "Open with Live Server"

**방법 2: Python 간이 서버**
```bash
# Python 3
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

**방법 3: Node.js http-server**
```bash
npm install -g http-server
http-server

# 브라우저에서 표시된 주소 접속
```

## 📊 주요 기능

### ✅ 거래 내역 관리
- 고객명, 연락처, 작업일 입력
- 위치 선택 (용인/수원/화성 세부 지역)
- 서비스 유형 분류
- 작업 내용 상세 기록
- 비용 항목별 관리 (총 비용, 자재비, 인건비, 순이익)

### 📈 통계 대시보드
- 총 거래 건수
- 총 매출액
- 총 자재비
- 순이익 합계

### 🔍 검색 및 필터
- 실시간 검색 (고객명, 위치, 내용)
- 기간별 필터 (오늘/이번 주/이번 달)

### ✏️ 수정 및 삭제
- 거래 내역 수정
- 거래 내역 삭제
- 실시간 데이터 동기화

## 🎨 커스터마이징

### 색상 변경
`styles.css` 파일에서 다음 색상 코드 수정:

```css
/* 메인 그라데이션 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 강조 색상 */
color: #667eea;
```

### 지역 추가/수정
`index.html` 파일의 location select 옵션 수정:

```html
<option value="새로운지역">새로운지역</option>
```

### 서비스 유형 추가
`index.html` 파일의 serviceType select 옵션 수정:

```html
<option value="새서비스">새서비스</option>
```

## 🔒 보안 권장사항

1. **Firebase 인증 추가**: 운영 환경에서는 Firebase Authentication 설정 필수
2. **Firestore 보안 규칙**: 개발 완료 후 반드시 보안 규칙 강화
3. **환경 변수**: Firebase 설정을 환경 변수로 분리 (선택사항)

## 🐛 문제 해결

### CORS 오류
- 로컬 파일을 직접 열지 말고 웹 서버를 통해 실행
- Live Server, http-server 등 사용

### Firebase 연결 오류
- Firebase 설정 정보가 정확한지 확인
- Firestore Database가 활성화되었는지 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 데이터가 저장되지 않음
- Firestore 보안 규칙 확인
- 네트워크 연결 확인
- 브라우저 콘솔에서 오류 확인

## 📱 향후 추가 기능 아이디어

- [ ] 월별/연도별 리포트 생성
- [ ] Excel/PDF 내보내기
- [ ] 고객 관리 시스템 연동
- [ ] 작업 사진 첨부 기능
- [ ] 예약/일정 관리
- [ ] 모바일 앱 버전
- [ ] 송장/견적서 자동 생성
- [ ] 재방문 고객 관리

## 📞 문의

에벤에셀 전기
010-6595-5119