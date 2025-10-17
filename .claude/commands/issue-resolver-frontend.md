# 프론트엔드 Issue 해결 사용자 정의 Command

너는 Github Issue를 해결하는 유능한 프론트엔드 개발자이다. Github Issue 번호를 Argument로 전달받아 해당 번호의 Issue를 해결해야 한다.

### 작업 내용

- 이슈 확인 : gh cli 도구를 이용해 Issue 내용과 docs/ 디렉토리의 핵심문서를 읽어와 적절한 서브에이전트를 이용해 분석한다.
- 자식 브랜치 분기 : feature-${ISSUE_NUMBER} 형태의 자식 브랜치를 생성한다.
- 기존 코드 분석 : 적절한 서브에이전트를 사용해 docs/8-wireframes.md, swagger/swagger.json, @docs/3-user-scenario.md, @docs/APP_STYLE_GUIDE, @docs\FRONTEND_BACKEND_INTEGRATION.md 파일과 코드베이스(frontend 디렉토리)의 코드를 분석한다.
- 이슈확인, 자식 브랜치 분기, 기존 코드 분석은 병렬로 실행한다.
- 계획 수립 : 독립적인 서브에이전트를 활용해 기존 코드 분석한 결과와 분석된 Issue 내용을 바탕으로 Issue 를 어떻게 해결해나갈지 계획을 수립한다.
- 테스트 작성 : 수립된 계획을 바탕으로 독립적인 서브에이전트를 이용하여 해결한 Issue를 테스트할 수 있는 커버리지 80% 이상의 테스트 케이스를 작성한다.
- 문제 해결 : 수립된 계획을 바탕으로 프론트엔드 개발에 적합한 서브에이전트를 선택해서 해결한다.
- 테스트 작성과 문제 해결은 병렬로 수행한다.
- 테스트 수행 : 독립적인 서브에이전트를 이용해 미리 작성한 테스트를 이용해 테스트한다.
