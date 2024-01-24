import * as React from 'react';
import { Text } from 'react-native';
import auth from '@react-native-firebase/auth';

function App() {
  const user = auth().currentUser;

  return <Text>Welcome {user.email}</Text>;
}

export default App;
