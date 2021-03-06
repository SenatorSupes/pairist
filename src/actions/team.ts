import { auth, db, funcs } from '../firebase';
import { TeamData } from '../types';

const teamsRef = db.collection('teams');
const createTeamFunc = funcs.httpsCallable('createTeam');
const addTeamMemberFunc = funcs.httpsCallable('addTeamMember');
const removeTeamMemberFunc = funcs.httpsCallable('removeTeamMember');

export async function createTeam(team: Partial<TeamData>) {
  const { teamId, teamName } = team;

  if (!teamId) return;

  const currentUser = auth.currentUser;

  await createTeamFunc({
    teamId,
    teamName,
    userDisplayName: currentUser ? currentUser.displayName : '',
    userPhotoURL: currentUser ? currentUser.photoURL : '',
  });
}

export async function updateTeam(newValues: Partial<TeamData>) {
  const opts: Partial<TeamData> = {};

  if (newValues.hasOwnProperty('teamName')) opts.teamName = newValues.teamName;

  await teamsRef.doc(newValues.teamId).set(
    {
      ...opts,
    },
    { merge: true }
  );
}

export async function addTeamMember(teamId: string, teamName: string, memberEmail: string) {
  await addTeamMemberFunc({
    teamId,
    teamName,
    memberEmail,
  });
}

export async function removeTeamMember(teamId: string, userId: string) {
  await removeTeamMemberFunc({
    teamId,
    userId,
  });
}
