import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import { ChevronLeftIcon } from '@/components/shared/Icons';

// Mapping icons by name
const MODULE_ICONS: Record<string, string> = {
  DashboardIcon: '📊',
  CardapioIcon: '🍔',
  BagIcon: '🛍️',
  ClocheIcon: '📦',
  FileTextIcon: '💵',
  ShieldCheckIcon: '🛡️',
  PinIcon: '📍',
  FoodStoreIcon: '🌐',
};

// Custom detailed benefits for each module
const DETAILED_BENEFITS: Record<string, { roi: string; highlights: string[] }> = {
  financeiro: {
    roi: 'Aumente em média 12% sua margem de lucro',
    highlights: [
      'DRE estruturada (Demonstração do Resultado do Exercício) automática.',
      'Gráficos de receitas vs despesas consolidadas em tempo real.',
      'Cálculo automático de Custos de Mercadorias Vendidas (CMV).',
      'Exportação simplificada para formato PDF ou XLS para seu contador.',
    ]
  },
  fidelidade: {
    roi: 'Aumente em 35% a recorrência dos clientes',
    highlights: [
      'Cashback acumulativo personalizado para compras recorrentes.',
      'Sistema de pontuação automática e cupons com validade configurável.',
      'Gatilhos de marketing baseados no comportamento do cliente.',
      'Alertas por WhatsApp integrados de pontos a expirar.',
    ]
  },
  mesas: {
    roi: 'Reduza em 20% o tempo de espera no salão',
    highlights: [
      'Mapa de mesas interativo e monitoramento em tempo real.',
      'Comandas de consumo individual com rateio de taxa facilitado.',
      'QR Code de mesa para os clientes acessarem o cardápio e pedirem sozinhos.',
      'Controle integrado de reservas online com lembretes.',
    ]
  },
  delivery: {
    roi: 'Economize até R$ 2.400 em taxas de marketplaces por mês',
    highlights: [
      'Site de delivery próprio customizado com sua identidade visual.',
      'Integração direta com envio automático de pedidos no WhatsApp.',
      'Configuração inteligente de taxas de entrega dinâmicas por bairro.',
      'Página leve e rápida otimizada para aparelhos celulares antigos.',
    ]
  },
};

const DEFAULT_BENEFITS = {
  roi: 'Ferramenta essencial para produtividade do seu negócio',
  highlights: [
    'Integração nativa de banco de dados do Almocu ADM.',
    'Interface reativa ultra veloz adaptada para Web e Mobile.',
    'Suporte prioritário 24/7 direto com a equipe técnica.',
    'Atualizações gratuitas e segurança ponta-a-ponta certificada.',
  ]
};

export default observer(function ModuloDetalhesScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const allModules = dataStore.modules || [];
  const moduleItem = allModules.find(m => m.id === id);

  if (!moduleItem) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: theme.text }}>Módulo não encontrado.</Text>
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: theme.contrast }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const icon = MODULE_ICONS[moduleItem.icon] || '🧩';
  const info = DETAILED_BENEFITS[moduleItem.id] || DEFAULT_BENEFITS;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(auth)/modulos' as any)}>
          <ChevronLeftIcon color={theme.text} size={24} />
          <Text style={[styles.backText, { color: theme.text }]}>Módulos</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Detalhes do Módulo</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[
        { paddingBottom: 40 },
        isWeb && { maxWidth: 650, width: '100%', alignSelf: 'center' }
      ]}>

        {/* Dynamic Gradient Header Card */}
        <LinearGradient 
          colors={[theme.contrast, theme.contrast + 'CC']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Text style={styles.heroIconText}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{moduleItem.name}</Text>
              <Text style={styles.heroRoi}>{info.roi}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Core details */}
        <View style={[styles.infoCard, { backgroundColor: theme.foreground }]}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>O que este módulo faz?</Text>
          <Text style={[styles.descriptionText, { color: theme.text }]}>{moduleItem.description}</Text>

          <View style={styles.divider} />

          <Text style={[styles.sectionHeading, { color: theme.text }]}>Destaques e Benefícios</Text>
          <View style={styles.highlightsContainer}>
            {info.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightRow}>
                <Text style={[styles.checkText, { color: theme.contrast }]}>✓</Text>
                <Text style={[styles.highlightText, { color: theme.text }]}>{highlight}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Call to Action panel */}
        <View style={[styles.ctaCard, { backgroundColor: theme.foreground }]}>
          <View style={styles.ctaPriceRow}>
            <View>
              <Text style={[styles.ctaPriceLabel, { color: theme.text }]}>Mensalidade do módulo</Text>
              <Text style={[styles.ctaPeriod, { color: theme.text }]}>Cancele quando quiser</Text>
            </View>
            <Text style={[styles.ctaPriceValue, { color: theme.contrast }]}>
              {moduleItem.price === 0 ? 'Grátis' : `R$ ${moduleItem.price.toFixed(2).replace('.', ',')}`}
            </Text>
          </View>

          {moduleItem.acquired ? (
            <View style={styles.acquiredBox}>
              <Text style={styles.acquiredText}>✓ Você já possui este módulo ativo</Text>
              <TouchableOpacity 
                style={[styles.gerenciarBtn, { borderColor: theme.contrast }]} 
                onPress={() => router.push('/(auth)/modulos/gerenciar' as any)}
              >
                <Text style={[styles.gerenciarBtnText, { color: theme.contrast }]}>Ir para Gerenciamento</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.purchaseBtn, { backgroundColor: theme.contrast }]}
              onPress={() => router.push({ pathname: '/(auth)/modulos/checkout' as any, params: { id: moduleItem.id } } as any)}
            >
              <Text style={styles.purchaseBtnText}>ADQUIRIR MÓDULO AGORA</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 80,
  },
  backText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 15,
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#FFFFFF33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: {
    fontSize: 32,
  },
  heroName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  heroRoi: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 13,
    color: '#FFFFFFD0',
    marginTop: 2,
  },
  infoCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  sectionHeading: {
    fontFamily: 'Jost_700Bold',
    fontSize: 15,
    marginBottom: 12,
  },
  descriptionText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: '#9CA3AF22',
    marginVertical: 20,
  },
  highlightsContainer: {
    gap: 12,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    lineHeight: 18,
  },
  highlightText: {
    flex: 1,
    fontFamily: 'Jost_400Regular',
    fontSize: 13.5,
    lineHeight: 18,
    opacity: 0.8,
  },
  ctaCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#9CA3AF15',
  },
  ctaPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaPriceLabel: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
  },
  ctaPeriod: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.5,
    marginTop: 1,
  },
  ctaPriceValue: {
    fontFamily: 'Jost_700Bold',
    fontSize: 22,
  },
  purchaseBtn: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseBtnText: {
    fontFamily: 'Jost_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  acquiredBox: {
    alignItems: 'center',
    marginTop: 8,
  },
  acquiredText: {
    fontFamily: 'Jost_700Bold',
    color: '#10B981',
    fontSize: 14,
    marginBottom: 12,
  },
  gerenciarBtn: {
    borderWidth: 2,
    width: '100%',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gerenciarBtnText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 13.5,
  },
});
