---
description: 프로젝트 컨텍스트 및 AI 코딩 가이드라인 (Knowledge)
---

# 🌐 JUK's Personal Portfolio - AI Context

본 문서는 JUK(사용자)의 포트폴리오 웹사이트를 이어서 개발하기 위해 안티그래비티(AI)가 참고해야 할 **배경 지식, 코딩 규칙 및 목표**를 정의합니다.

## 1. 프로젝트 개요 (Overview)
- **목적**: 개인 포트폴리오용 웹사이트 구축
- **기술 스택**: 순수 HTML, CSS(Vanilla), JS(Vanilla) (프레임워크 없음)

## 2. 디자인 시스템 (Design Aesthetics)
- **테마**: 다크 모드 (Dark Mode) 위주
- **스타일**:
  - 글래스모피즘 (Glassmorphism): 반투명 배경 및 블러(Blur) 효과 사용
  - 부드러운 그라데이션 및 트렌디한 컬러(현대적이고 깊이 있는 디자인)
  - 폰트: 시스템 기본 폰트를 피하고, 구글 폰트(`Inter`, `Outfit` 등)를 로드하여 세련된 모던 타이포그래피 구현
- **인터랙션(Interaction)**:
  - 부드럽고 풍부한 마이크로 애니메이션(Micro-animations)을 넣어 심심하지 않은 웹사이트 구성
  - 스크롤 시 등장 애니메이션(`IntersectionObserver` 활용) 적용

## 3. SEO 및 웹 표준 (SEO & Standards)
- **시맨틱 마크업**: 메인 콘텐츠별로 `<header>`, `<main>`, `<section>`, `<footer>` 등 시맨틱 태그 사용
- 헤딩 계층 구조 준수(단일 `<h1>` 태그 유지)
- 접근성(A11y)을 위해 모든 입력 요소와 버튼, 이미지(`alt`) 등에 적절한 라벨 제공

## 4. 작업 방식 (Workflow Rules)
1. **디자인 최우선**: 단순히 기능만 작동하는 '최소 기능 제품(MVP)' 수준이 아닌, 시작 단계부터 사용자를 감탄시킬 수준의("WOW") **프리미엄 디자인**을 고려하여 코드를 작성합니다.
2. Placeholder 이미지 대신, `generate_image` 툴을 활용해 실제 어울리는 시연용 이미지를 만들어 삽입합니다.
3. CSS는 `style.css`에 분리하여 작성하고, 중복을 막기 위해 상단에 CSS 변수(`:root`)를 활용한 디자인 토큰 시스템을 구축합니다.

이 문서는 다른 PC에서도 `git pull`을 통해 동기화되어, 동일한 맥락에서 즉시 작업을 이어가기 위한 뇌(Brain/Context) 역할을 합니다.
