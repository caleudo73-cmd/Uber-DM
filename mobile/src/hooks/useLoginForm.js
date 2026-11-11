import { useState } from 'react';
import useAuth from './useAuth';
import useAsyncAction from './useAsyncAction';

export default function useLoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { run, loading, error } = useAsyncAction(signIn);

  const submit = () => run(email.trim(), password);

  return { email, setEmail, password, setPassword, submit, loading, error };
}
