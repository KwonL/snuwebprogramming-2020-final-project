
## 기본스펙

뼈대 코드를 기본으로 하여 다음이 구현되어 있어야 한다.  
모든 행동들은 서버에서 이루어지나, 클라이언트에서 별도로 확인이 가능하여야 한다.(html 결과창에 결과가 프린트되면된다)

- [X] 온라인에서 플레이가 가능하다(https://gy4id.sse.codesandbox.io/)
- [X] 로그인, 회원가입
- [X] 10 * 10 이상의 맵
- [X] 캐릭터의 이동
- [X] 이동 시 필드별로 아무일도 일어나지 않음, 전투, 아이템 획득의 일이 일어남.
- [X] 5종 이상의 몬스터
- [X] 5종 이상의 아이템
- [X] 전투 시스템( str, def, hp 개념을 활용)
- [X] 사망 시스템(전투 시 hp가 0이될 경우 캐릭터가 사망. 0,0 위치로 이동)
- [X] 레벨 시스템( 일정 이상 경험치 획득 시 캐릭터 레벨업.)

## 추가스펙

추가 스펙은 조별로 구현가능한 부분을 구현하면 된다.

- [X] 체력회복하는 이벤트가 추가된다.
- [X] 필드에서 일어나는 이벤트 중 랜덤이벤트가 존재한다.
- [X] 아이템을 소유할 경우, 캐릭터의 능력치가 향상된다. 능력치가 클라이언트에서 확인이 가능하다.
- [ ] 시작 능력치가 랜덤하게 주어지며, 5번에 한하여 재시도가 가능하다.
- [X] 사망시 랜덤하게 아이템을 잃어버린다.
- [X] 유저의 인벤토리가 클라이언트 상에서 확인이 가능하다.
- [ ] 전투 중, 10턴 안에 전투가 끝나지 않거나, 체력이 20% 이하로 감소할 경우 도망가는 선택지가 추가로 주어진다.

## 발표

git branch를 통한 개별 작업 후 머지 / 버그 수정 : 마스터에서 직접

git project 개설, 뼈대 코드 복사, toDoList 생성 : 이권형
맵, 5종 이상의 몬스터 제작, 이벤트 구현, 몬스터와의 전투 시스템 구현, 레벨업 및 경험치 획득 구현 : 박규민
아이템 획득 및 스탯 적용 구현, 사망시 0,0지점 이동 구현, 사망시 아이템 랜덤 분실 구현, 로그인 구현 : 김선도
player마다 map model 랜덤하게 갖도록 변경, 각 map에서의 이벤트도 3가지중 랜덤하게 발생하도록 구현, git merge / branch 관리, 기타 로직 및 버그 수정 : 이권형
게임 난이도 조절, 사망 관련 버그 수정 : 김선도
온라인 플레이 가능하도록 만듦 : 박규민

전투 방식
플레이어 선공 방식의 턴제 방식 - 데미지 = str*(10/def+10)
레벨업 필요 경험치량 : 레벨에 정비례
획득 경험치 : 몬스터 타입에 따라 다름

