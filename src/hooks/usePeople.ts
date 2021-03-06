import { useCollectionData } from 'react-firebase-hooks/firestore';
import { useParams } from 'react-router';
import { db } from '../firebase';
import { PersonData, RouteParams } from '../types';

export function usePeople() {
  const { teamId = '-' } = useParams<RouteParams>();
  const [data = [], loading, error] = useCollectionData<PersonData>(
    db.collection('teams').doc(teamId).collection('people'),
    {
      idField: 'userId',
    }
  );

  if (error || loading) {
    error && console.error(error);
    return [];
  }

  return data;
}
