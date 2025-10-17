# Team CalTalk 스타일 가이드

## 개요

이 문서는 Team CalTalk 프로젝트의 UI 디자인과 Tailwind CSS 적용 지침을 정의합니다.

---

## 색상 팔레트

### Primary Colors (주요 색상)

```css
/* 파란색 - 주요 액션, 활성 상태 */
primary-50: #EFF6FF
primary-100: #DBEAFE
primary-500: #3B82F6  /* 기본 버튼, 활성 탭 */
primary-600: #2563EB  /* 호버 상태 */
primary-700: #1D4ED8  /* 눌림 상태 */
```

**Tailwind 클래스:**
- `bg-blue-500`, `hover:bg-blue-600`, `active:bg-blue-700`
- `text-blue-500`, `border-blue-500`

### Secondary Colors (보조 색상)

```css
/* 녹색 - 일정, 성공 상태 */
success-400: #4ADE80
success-500: #22C55E  /* 일정 블록 */
success-600: #16A34A  /* 일정 호버 */
```

**Tailwind 클래스:**
- `bg-green-500`, `hover:bg-green-600`
- `text-green-500`

### Neutral Colors (중립 색상)

```css
/* 회색 - 배경, 보더, 비활성 텍스트 */
gray-50: #F9FAFB    /* 배경 */
gray-100: #F3F4F6   /* 카드 배경 */
gray-200: #E5E7EB   /* 보더 */
gray-400: #9CA3AF   /* 보조 텍스트 */
gray-600: #4B5563   /* 본문 텍스트 */
gray-900: #111827   /* 제목, 강조 텍스트 */
```

**Tailwind 클래스:**
- `bg-gray-50`, `bg-gray-100`
- `border-gray-200`, `border-gray-300`
- `text-gray-400`, `text-gray-600`, `text-gray-900`

### Status Colors (상태 색상)

```css
/* 에러 */
error-500: #EF4444
error-600: #DC2626

/* 경고 */
warning-500: #F59E0B
warning-600: #D97706

/* 정보 */
info-500: #06B6D4
info-600: #0891B2
```

---

## 타이포그래피

### 폰트 패밀리

```css
font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif
```

**Tailwind 설정:**
```javascript
// tailwind.config.js
fontFamily: {
  sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans KR', 'sans-serif'],
}
```

### 폰트 크기 및 굵기

| 용도 | 클래스 | 크기 | 굵기 |
|------|--------|------|------|
| 페이지 제목 | `text-2xl font-bold` | 24px | 700 |
| 섹션 제목 | `text-xl font-semibold` | 20px | 600 |
| 서브 제목 | `text-lg font-medium` | 18px | 500 |
| 본문 | `text-base` | 16px | 400 |
| 작은 텍스트 | `text-sm` | 14px | 400 |
| 매우 작은 텍스트 | `text-xs` | 12px | 400 |

### 텍스트 스타일 예시

```jsx
{/* 페이지 제목 */}
<h1 className="text-2xl font-bold text-gray-900">MyApp 개발 팀1</h1>

{/* 섹션 제목 */}
<h2 className="text-xl font-semibold text-gray-900">팀 채팅</h2>

{/* 본문 */}
<p className="text-base text-gray-600">아직 메시지가 없습니다</p>

{/* 보조 텍스트 */}
<span className="text-sm text-gray-400">팀원 2명</span>
```

---

## 레이아웃

### 컨테이너

```jsx
{/* 전체 페이지 레이아웃 */}
<div className="min-h-screen bg-gray-50">
  {/* 헤더 */}
  <header className="sticky top-0 z-50 bg-white shadow-sm">
    {/* ... */}
  </header>

  {/* 메인 콘텐츠 */}
  <main className="container mx-auto px-4 py-6">
    {/* ... */}
  </main>
</div>
```

### 그리드 시스템

```jsx
{/* 2열 레이아웃 (캘린더 + 채팅) */}
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
  <div>{/* 캘린더 */}</div>
  <div>{/* 채팅 */}</div>
</div>

{/* 캘린더 그리드 (7열) */}
<div className="grid grid-cols-7 gap-0 border border-gray-200">
  {/* 요일 헤더 */}
  <div className="border-b border-gray-200 p-2 text-center">
    <span className="text-sm font-medium text-gray-600">일</span>
  </div>
  {/* ... */}
</div>
```

### 간격 (Spacing)

| 용도 | 클래스 |
|------|--------|
| 섹션 간격 | `mb-6`, `mt-6` |
| 요소 간격 | `mb-4`, `mt-4` |
| 작은 간격 | `mb-2`, `mt-2` |
| 패딩 (컨테이너) | `p-4`, `px-4`, `py-6` |
| 패딩 (카드) | `p-4`, `p-6` |

---

## 컴포넌트

### 네비게이션 바

```jsx
<nav className="bg-white shadow-sm border-b border-gray-200">
  <div className="container mx-auto px-4">
    <div className="flex items-center justify-between h-16">
      {/* 로고 */}
      <div className="text-xl font-bold text-gray-900">팀캘톡</div>

      {/* 메뉴 */}
      <ul className="flex space-x-8">
        <li>
          <a className="text-gray-600 hover:text-gray-900 transition-colors">
            대시보드
          </a>
        </li>
        <li>
          <a className="text-blue-500 font-medium border-b-2 border-blue-500 pb-4">
            MyApp 개발 팀1
          </a>
        </li>
      </ul>

      {/* 우측 액션 */}
      <button className="text-gray-600 hover:text-gray-900">
        로그아웃
      </button>
    </div>
  </div>
</nav>
```

**스타일 규칙:**
- 배경: `bg-white`
- 그림자: `shadow-sm`
- 높이: `h-16`
- 활성 탭: `text-blue-500 border-b-2 border-blue-500`
- 비활성 탭: `text-gray-600 hover:text-gray-900`

### 버튼

#### Primary Button (주요 버튼)

```jsx
<button className="
  px-4 py-2
  bg-blue-500 hover:bg-blue-600 active:bg-blue-700
  text-white text-sm font-medium
  rounded-lg
  transition-colors
  shadow-sm hover:shadow-md
">
  + 새 일정
</button>
```

#### Secondary Button (보조 버튼)

```jsx
<button className="
  px-4 py-2
  bg-white hover:bg-gray-50
  text-gray-700
  border border-gray-300
  rounded-lg
  transition-colors
">
  새로고침
</button>
```

#### Icon Button (아이콘 버튼)

```jsx
<button className="
  p-2
  text-gray-600 hover:text-gray-900 hover:bg-gray-100
  rounded-lg
  transition-colors
">
  <RefreshIcon className="w-5 h-5" />
</button>
```

#### 크기 변형

| 크기 | 클래스 |
|------|--------|
| 소형 | `px-3 py-1.5 text-sm` |
| 중형 (기본) | `px-4 py-2 text-sm` |
| 대형 | `px-6 py-3 text-base` |

### 카드

```jsx
<div className="
  bg-white
  rounded-lg
  shadow-sm
  border border-gray-200
  p-6
">
  {/* 카드 내용 */}
</div>
```

**변형:**
- 호버 효과: `hover:shadow-md transition-shadow`
- 클릭 가능: `cursor-pointer hover:border-blue-300`

### 입력 필드

```jsx
{/* 텍스트 입력 */}
<input
  type="text"
  placeholder="메시지를 입력하세요..."
  className="
    w-full
    px-4 py-2
    border border-gray-300 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    placeholder:text-gray-400
    text-sm
  "
/>

{/* 텍스트 영역 */}
<textarea
  placeholder="메시지를 입력하세요..."
  className="
    w-full
    px-4 py-2
    border border-gray-300 rounded-lg
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    placeholder:text-gray-400
    text-sm
    resize-none
  "
  rows="3"
/>
```

**상태별 스타일:**
- 기본: `border-gray-300`
- 포커스: `focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- 에러: `border-red-500 focus:ring-red-500`
- 비활성: `bg-gray-100 cursor-not-allowed`

### 배지 (Badge)

```jsx
{/* 상태 배지 */}
<span className="
  inline-flex items-center
  px-2 py-1
  bg-green-100 text-green-700
  text-xs font-medium
  rounded-full
">
  온라인
</span>

{/* 카운트 배지 */}
<span className="
  inline-flex items-center justify-center
  w-5 h-5
  bg-blue-500 text-white
  text-xs font-bold
  rounded-full
">
  2
</span>
```

### 탭 (Tabs)

```jsx
<div className="flex space-x-4 border-b border-gray-200">
  {/* 활성 탭 */}
  <button className="
    px-4 py-2
    text-blue-500 font-medium
    border-b-2 border-blue-500
    -mb-px
  ">
    월
  </button>

  {/* 비활성 탭 */}
  <button className="
    px-4 py-2
    text-gray-600 hover:text-gray-900
    border-b-2 border-transparent
    -mb-px
  ">
    주
  </button>

  <button className="
    px-4 py-2
    text-gray-600 hover:text-gray-900
    border-b-2 border-transparent
    -mb-px
  ">
    일
  </button>
</div>
```

### 캘린더 컴포넌트

#### 캘린더 헤더

```jsx
<div className="flex items-center justify-between mb-4">
  {/* 월/연도 표시 */}
  <h2 className="text-xl font-semibold text-gray-900">
    2025년 10월
  </h2>

  {/* 뷰 전환 버튼 */}
  <div className="flex space-x-2">
    <button className="
      px-4 py-2
      bg-green-500 text-white
      rounded-lg
      text-sm font-medium
    ">
      월
    </button>
    <button className="
      px-4 py-2
      bg-white text-gray-700
      border border-gray-300
      rounded-lg
      text-sm
    ">
      주
    </button>
    <button className="
      px-4 py-2
      bg-white text-gray-700
      border border-gray-300
      rounded-lg
      text-sm
    ">
      일
    </button>
  </div>
</div>
```

#### 캘린더 그리드

```jsx
<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  {/* 요일 헤더 */}
  <div className="grid grid-cols-7 border-b border-gray-200">
    <div className="p-2 text-center">
      <span className="text-sm font-medium text-red-500">일</span>
    </div>
    <div className="p-2 text-center">
      <span className="text-sm font-medium text-gray-900">월</span>
    </div>
    {/* ... */}
    <div className="p-2 text-center">
      <span className="text-sm font-medium text-blue-500">토</span>
    </div>
  </div>

  {/* 날짜 그리드 */}
  <div className="grid grid-cols-7">
    {/* 날짜 셀 */}
    <div className="
      min-h-[100px] p-2
      border-r border-b border-gray-200
      hover:bg-gray-50
      cursor-pointer
    ">
      <div className="text-sm font-medium text-gray-900 mb-1">01</div>
      {/* 일정 아이템 */}
    </div>
  </div>
</div>
```

#### 일정 아이템

```jsx
{/* 단일 일정 */}
<div className="
  bg-green-500
  text-white text-xs
  px-2 py-1
  rounded
  truncate
  hover:bg-green-600
  cursor-pointer
">
  팀장 일정11
</div>

{/* 여러 날짜에 걸친 일정 */}
<div className="
  col-span-3
  bg-green-500
  text-white text-xs
  px-2 py-1
  rounded
  truncate
  hover:bg-green-600
  cursor-pointer
">
  일정1
</div>
```

### 채팅 사이드바

```jsx
<aside className="
  w-full lg:w-[400px]
  bg-white
  rounded-lg
  shadow-sm
  border border-gray-200
  flex flex-col
  h-[calc(100vh-200px)]
">
  {/* 헤더 */}
  <div className="
    flex items-center justify-between
    px-4 py-3
    border-b border-gray-200
  ">
    <div className="flex items-center space-x-2">
      <span className="text-lg font-semibold text-gray-900">팀 채팅</span>
      <span className="text-xs text-gray-400">팀원 2명</span>
    </div>
  </div>

  {/* 날짜 구분선 */}
  <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
    <span className="text-xs text-gray-500">10월 17일 (금)</span>
    <span className="ml-2 text-xs text-green-500">온라인</span>
  </div>

  {/* 메시지 영역 */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* 빈 상태 */}
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <p className="text-sm">아직 메시지가 없습니다</p>
      <p className="text-xs mt-1">첫 번째 메시지를 보내보세요</p>
    </div>
  </div>

  {/* 입력 영역 */}
  <div className="px-4 py-3 border-t border-gray-200">
    <div className="flex items-center space-x-2">
      <input
        type="text"
        placeholder="메시지를 입력하세요..."
        className="
          flex-1
          px-3 py-2
          border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          text-sm
        "
      />
      <button className="
        p-2
        bg-blue-500 hover:bg-blue-600
        text-white
        rounded-lg
        transition-colors
      ">
        <SendIcon className="w-5 h-5" />
      </button>
    </div>
    <p className="text-xs text-gray-400 mt-1">
      Enter로 전송, Shift+Enter로 줄바꿈
    </p>
  </div>
</aside>
```

### 채팅 메시지

```jsx
{/* 내 메시지 */}
<div className="flex justify-end mb-3">
  <div className="max-w-[70%]">
    <div className="
      bg-blue-500 text-white
      px-3 py-2
      rounded-lg rounded-tr-none
      text-sm
    ">
      안녕하세요!
    </div>
    <p className="text-xs text-gray-400 mt-1 text-right">오후 2:30</p>
  </div>
</div>

{/* 상대방 메시지 */}
<div className="flex justify-start mb-3">
  <div className="max-w-[70%]">
    <p className="text-xs text-gray-600 mb-1">홍길동</p>
    <div className="
      bg-gray-100 text-gray-900
      px-3 py-2
      rounded-lg rounded-tl-none
      text-sm
    ">
      네, 반갑습니다!
    </div>
    <p className="text-xs text-gray-400 mt-1">오후 2:31</p>
  </div>
</div>

{/* 시스템 메시지 */}
<div className="flex justify-center mb-3">
  <div className="
    bg-gray-100 text-gray-600
    px-3 py-1
    rounded-full
    text-xs
  ">
    홍길동님이 입장했습니다
  </div>
</div>
```

---

## 반응형 디자인

### 브레이크포인트

```javascript
// tailwind.config.js
screens: {
  'sm': '640px',   // 모바일 (가로)
  'md': '768px',   // 태블릿
  'lg': '1024px',  // 데스크톱
  'xl': '1280px',  // 큰 데스크톱
}
```

### 반응형 레이아웃 패턴

```jsx
{/* 모바일: 1열, 데스크톱: 2열 */}
<div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
  <div>{/* 메인 콘텐츠 */}</div>
  <div className="hidden lg:block">{/* 사이드바 */}</div>
</div>

{/* 모바일에서 숨기기 */}
<div className="hidden md:block">데스크톱 전용 콘텐츠</div>

{/* 모바일에서만 표시 */}
<div className="block md:hidden">모바일 전용 콘텐츠</div>

{/* 반응형 텍스트 크기 */}
<h1 className="text-xl md:text-2xl lg:text-3xl font-bold">제목</h1>

{/* 반응형 패딩 */}
<div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">내용</div>
```

---

## 애니메이션 및 전환 효과

### Transition 클래스

```jsx
{/* 색상 전환 */}
<button className="bg-blue-500 hover:bg-blue-600 transition-colors duration-200">
  버튼
</button>

{/* 그림자 전환 */}
<div className="shadow-sm hover:shadow-md transition-shadow duration-200">
  카드
</div>

{/* 변형 전환 */}
<div className="scale-100 hover:scale-105 transition-transform duration-200">
  확대 효과
</div>

{/* 투명도 전환 */}
<div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
  페이드 인
</div>
```

### 로딩 스피너

```jsx
<div className="flex items-center justify-center">
  <div className="
    w-8 h-8
    border-4 border-blue-200
    border-t-blue-500
    rounded-full
    animate-spin
  "></div>
</div>
```

### 페이드 인 애니메이션

```jsx
<div className="animate-fade-in">
  {/* 내용 */}
</div>

{/* tailwind.config.js에 추가 */}
animation: {
  'fade-in': 'fadeIn 0.3s ease-in-out',
},
keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'translateY(10px)' },
    '100%': { opacity: '1', transform: 'translateY(0)' },
  },
}
```

---

## 아이콘 사용

### Heroicons 적용

```jsx
import {
  CalendarIcon,
  ChatBubbleLeftIcon,
  UserGroupIcon,
  PlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

{/* 아이콘 크기 */}
<CalendarIcon className="w-5 h-5" /> {/* 소형 */}
<ChatBubbleLeftIcon className="w-6 h-6" /> {/* 중형 */}
<UserGroupIcon className="w-8 h-8" /> {/* 대형 */}

{/* 아이콘 + 텍스트 */}
<button className="flex items-center space-x-2">
  <PlusIcon className="w-5 h-5" />
  <span>새 일정</span>
</button>
```

---

## 접근성 (Accessibility)

### 포커스 스타일

```jsx
{/* 버튼 */}
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-blue-500
  focus:ring-offset-2
">
  버튼
</button>

{/* 입력 필드 */}
<input className="
  focus:outline-none
  focus:ring-2
  focus:ring-blue-500
  focus:border-transparent
" />
```

### ARIA 속성

```jsx
{/* 버튼 */}
<button
  aria-label="새 일정 추가"
  className="..."
>
  <PlusIcon />
</button>

{/* 입력 필드 */}
<input
  type="text"
  aria-label="메시지 입력"
  placeholder="메시지를 입력하세요..."
/>

{/* 상태 표시 */}
<div role="status" aria-live="polite">
  메시지가 전송되었습니다
</div>
```

### 키보드 네비게이션

```jsx
{/* 탭 네비게이션 */}
<div role="tablist">
  <button
    role="tab"
    aria-selected="true"
    tabIndex={0}
    className="..."
  >
    월
  </button>
  <button
    role="tab"
    aria-selected="false"
    tabIndex={-1}
    className="..."
  >
    주
  </button>
</div>
```

---

## 유틸리티 클래스 조합 패턴

### 카드 컨테이너

```jsx
className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
```

### 플렉스 센터 정렬

```jsx
className="flex items-center justify-center"
```

### 절대 위치 중앙 정렬

```jsx
className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
```

### 말줄임표

```jsx
{/* 한 줄 */}
className="truncate"

{/* 여러 줄 (2줄) */}
className="line-clamp-2"
```

### 스크롤 영역

```jsx
className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
```

---

## Tailwind Config 설정

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Noto Sans KR', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/line-clamp'),
  ],
}
```

---

## 베스트 프랙티스

### 1. 일관성 유지

- 동일한 기능의 요소는 동일한 클래스 조합 사용
- 컴포넌트 라이브러리(shadcn/ui) 활용

### 2. 재사용 가능한 컴포넌트

```jsx
// Button.jsx
export const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = "rounded-lg font-medium transition-colors"

  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 3. clsx/classnames 사용

```jsx
import clsx from 'clsx'

<div className={clsx(
  'base-class',
  isActive && 'active-class',
  isDisabled && 'disabled-class',
  className // 외부에서 전달받은 클래스
)} />
```

### 4. Tailwind Merge 사용

```jsx
import { twMerge } from 'tailwind-merge'

<Button className={twMerge('px-4 py-2', customClassName)} />
```

---

## 디버깅 도구

### 개발 모드에서 클래스 확인

```jsx
{/* 개발 중 보더 표시 */}
<div className="border-2 border-red-500">디버깅용</div>

{/* 그리드 가이드 */}
<div className="bg-grid-gray-100">그리드 표시</div>
```

### Tailwind CSS IntelliSense (VS Code 확장)

- 자동 완성
- 클래스 미리보기
- 린팅

---

## 참고 자료

- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind UI Components](https://tailwindui.com/)
