# planning

Google 로그인 + Firestore 저장을 쓰는 개인용 플래너 (React + Vite).
허용된 이메일만 접근할 수 있고, 권한 검사는 Firestore 보안 규칙이 서버에서 처리합니다.

## 기능

- Google 로그인 (허용 목록에 없는 계정은 "접근 권한 없음" 화면 후 자동 로그아웃)
- 주간 날짜 탭, 날짜 직접 선택, 진행률
- 항목 추가 / 수정 / 삭제 / 완료 체크 (유형: 할 일, 회의, 마감, 메모)
- 설정: 접근 허용 이메일 추가/삭제 (소유자만), JSON 백업 내보내기, 로그아웃
- 오프라인 캐시 (인터넷이 끊겨도 보고 쓰기 가능, 다시 연결되면 동기화)

## 데이터 구조

```
config/access            { emails: ["joon7853@gmail.com", ...] }   ← 허용 목록
users/{uid}/items/{id}   { title, type, date, time, note, done, createdAt, updatedAt }
```

각 사용자는 자기 `users/{uid}` 아래만 읽고 쓸 수 있습니다.

---

## 1. Firebase 설정 (처음 한 번, 약 10분)

1. https://console.firebase.google.com 접속 → **프로젝트 추가** → 이름 `planning` → Google 애널리틱스는 꺼도 됨
2. 왼쪽 메뉴 **빌드 > Authentication** → 시작하기 → 로그인 방법에서 **Google** 사용 설정 → 지원 이메일 선택 → 저장
3. 왼쪽 메뉴 **빌드 > Firestore Database** → 데이터베이스 만들기
   - 위치: `nam5 (United States)` 추천
   - ⚠️ **반드시 "프로덕션 모드"로 시작** (테스트 모드는 30일간 누구나 읽고 쓸 수 있음)
4. Firestore **규칙** 탭 → 기존 내용 전부 지우고 이 레포의 `firestore.rules` 내용 붙여넣기 → **게시**
5. 프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → **웹(</>) 앱 추가** → 이름 `planning` (Hosting 체크 안 함)
   → 나오는 `firebaseConfig` 의 `apiKey`, `authDomain`, `projectId`, `appId` 값을 메모
6. **Authentication > 설정 > 승인된 도메인** → 도메인 추가 → `<GitHub아이디>.github.io`
7. 결제 플랜은 **Spark(무료) 그대로** 두기. 업그레이드하지 않으면 요금이 나갈 일이 없습니다.

## 2. GitHub 배포

1. 레포 **Settings > Secrets and variables > Actions > Variables 탭** → New repository variable 로 5개 등록

   | 이름 | 값 |
   | --- | --- |
   | `VITE_FIREBASE_API_KEY` | firebaseConfig.apiKey |
   | `VITE_FIREBASE_AUTH_DOMAIN` | firebaseConfig.authDomain |
   | `VITE_FIREBASE_PROJECT_ID` | firebaseConfig.projectId |
   | `VITE_FIREBASE_APP_ID` | firebaseConfig.appId |
   | `VITE_OWNER_EMAIL` | joon7853@gmail.com |

   (`apiKey` 는 비밀 키가 아니라 프로젝트 주소 같은 값이라 Variables 에 넣어도 괜찮습니다. 보안은 규칙이 담당합니다.)

2. 레포 **Settings > Pages** → Source 를 **GitHub Actions** 로 선택
3. `main` 브랜치에 push 하면 자동 배포 → `https://<GitHub아이디>.github.io/planning/`
   (Variables 를 나중에 등록했다면 Actions 탭에서 "Deploy to GitHub Pages" 를 Run workflow 로 다시 실행)

## 3. 잘 막혔는지 확인

Firestore **규칙** 탭 → **규칙 플레이그라운드**
- 위치: `/config/access`, 유형: get, 인증됨 체크, 제공업체 google, 이메일 `someone@example.com` → **거부됨** 이 나와야 정상
- 같은 설정에 이메일만 `joon7853@gmail.com` → **허용됨**

## 4. 로컬에서 실행 (선택)

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:5173
```

`localhost` 는 Firebase 승인된 도메인에 기본으로 들어 있습니다.

## 소유자 이메일 바꾸기

두 곳을 같이 바꿔야 합니다.
1. `firestore.rules` 의 `// OWNER` 줄 → 콘솔 규칙 탭에 다시 게시
2. GitHub Variables 의 `VITE_OWNER_EMAIL` → 재배포
