import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { permissionStore } from '@/stores/PermissionStore';
import { GenericPlaceholder } from "@/components/views/GenericPlaceholder";

export default function DashboardScreen() {
  const router = useRouter();

  useEffect(() => {
    if (!permissionStore.can('dashboard:view')) {
      router.replace('/(auth)');
    }
  }, []);

  return <GenericPlaceholder />;
}
