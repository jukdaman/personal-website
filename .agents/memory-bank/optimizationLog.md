# 🚀 optimizationLog (Tuning & Refactoring History)

이 문서는 프로젝트 전반의 성능 최적화, 렌더링 튜닝, 그리고 주요 리팩토링 내역을 시간순으로 기록하는 저장소입니다.

## 📌 [2026-05] Synapse Animation Refactoring & Optimization

### 1. 개요 (Overview)
Synapse 배경 애니메이션의 성능 저하(Stuttering) 및 메모리 가비지 컬렉션(GC) 압력 문제를 해결하고, 데이터 구조를 모듈화하여 유지보수성을 극대화하기 위한 리팩토링 및 최적화 작업을 진행했습니다.

## 2. 주요 변경 사항 (Key Changes)

### 2.1 성능 최적화 (Performance Optimization)
- **오브젝트 풀링(Object Pooling) 도입:** 매 프레임 애니메이션 루프(`animate`) 안에서 수천 개씩 동적으로 생성되던 임시 좌표 및 투명도 객체(`{x, y, z}`, `{sx, sy, scale...}` 등)를 제거했습니다. 대신 클래스 내부 속성(`this._pos`, `this._proj`)을 재사용하여 GC(Garbage Collection) 스파이크로 인한 프레임 드랍(Stuttering)을 완전히 해결했습니다.
- **삼각함수 사전 계산:** 씬 전체 회전에 사용되는 `Math.cos`, `Math.sin` 결과를 `background.js` 상단의 상수로 캐싱하여 불필요한 매 프레임 런타임 연산을 제거했습니다.
- **렌더링 부하 감소:** 실시간으로 `rgba(...)` 문자열을 조합하던 방식을 버리고, `ctx.globalAlpha`를 활용하여 캔버스 렌더링 파이프라인의 병목을 줄였습니다.

### 2.2 데이터 구조 분리 및 정규화 (Data Modularity)
- **독립적인 데이터 파일:** `background.js` 안에 하드코딩되어 있던 거대한 `ORIGINS` 배열 데이터를 `js/synapse_data.js`로 완전히 분리했습니다.
- **가독성 개선 및 정규화:** 
  - 시각적으로 무의미한 소수점 긴 자릿수를 깔끔하게 반올림 처리하고 정수화했습니다.
  - 마이너스 기호(`-`) 유무에 따라 울퉁불퉁하던 배열 데이터의 좌우 길이를 스페이스 패딩(Whitespace Padding)을 통해 엑셀 표처럼 반듯하게 오와 열을 맞추었습니다.
  - 각 다발 데이터에 `"id": "B0" ~ "B35"`의 식별자를 부여하고, 상단에 각 프로퍼티의 역할을 명시하는 꼼꼼한 주석을 추가했습니다.
  - `// prettier-ignore`를 선언하여 저장 시 포맷팅이 훼손되지 않도록 방어 로직을 마련했습니다.

### 2.3 튜닝 및 제어 상수 도입 (Tuning Constants)
- `background.js` 상단에 물리 엔진 및 렌더링에 관여하는 15종 이상의 상수를 모으고 한글 주석으로 상세한 매뉴얼을 작성했습니다.
- **수렴도 제어 (`SQUEEZE_POWER`):** 파티클 다발이 블랙홀로 빨려 들어갈 때 얼마나 빠르고 단단하게 한 줄기로 뭉칠지를 결정하는 `SQUEEZE_POWER` 상수를 신규 도입했습니다.

## 3. 파일 변경 내역
- `js/background.js`: 메인 애니메이션 로직 고도화 (오브젝트 풀링, 상수화, 주석 추가)
- `js/synapse_data.js`: (신규/분리됨) 36개의 파티클 다발 데이터(`ORIGINS`) 분리 및 정렬
- `index.html`: 분리된 데이터 모듈을 `background.js` 보다 먼저 로드하도록 `<script>` 순서 조정
- `test_synapse/synapse_generator.html`: 프로덕션과 완벽히 일치하도록 렌더링 엔진 로직 및 구조 동기화 완료
