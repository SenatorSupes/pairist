import { css } from 'astroturf';
import { Plus } from 'react-feather';
import { useMemberTeams } from '../hooks/useMemberTeams';
import { useModal } from '../hooks/useModal';
import Button from './Button';
import { CreateTeam } from './CreateTeam';

interface Props {}

export default function ChooseTeam(props: Props) {
  const [, setModalContent] = useModal();
  const memberTeams = useMemberTeams();

  const teams = [];

  for (const teamId in memberTeams) {
    const teamName = memberTeams[teamId];

    teams.push({
      name: teamName,
      content: (
        <li key={teamId}>
          <Button href={`/teams/${teamId}`}>{teamName}</Button>
        </li>
      ),
    });
  }

  teams.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className={styles.chooseTeam}>
      <h3>My teams</h3>

      {teams.length > 0 && <ul className={styles.teamList}>{teams.map((item) => item.content)}</ul>}

      <Button
        bold
        flavor="confirm"
        onClick={() => setModalContent(<CreateTeam />)}
        leftIcon={<Plus />}
      >
        Create a new team
      </Button>

      <p className={styles.small}>
        To join an existing team, ask
        <br />a team member to add you.
      </p>
    </div>
  );
}

const styles = css`
  @import '../variables.scss';

  .chooseTeam {
    width: 320px;
    margin: 30vh auto;
    text-align: center;
  }

  .teamList {
    margin: 0;
    padding: 0;

    li {
      margin: 0;
      margin-bottom: $unit-2;
      list-style-type: none;
    }
  }

  .small {
    font-size: 0.8em;
  }
`;
