import { useState } from 'react';
import { ROLES } from '../config/constants';
import useAuth from './useAuth';
import useAsyncAction from './useAsyncAction';

export default function useRegisterForm() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.PASSENGER);
  const { run, loading, error } = useAsyncAction(signUp);

  const submit = () => run({ name: name.trim(), email: email.trim(), password, role });

  return { name, setName, email, setEmail, password, setPassword, role, setRole, submit, loading, error };
}
