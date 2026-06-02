import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppTheme } from '@/themes/colors';
import { dataStore } from '@/stores/DataStore';
import {
  BuildingIcon,
  ChevronLeftIcon,
  EditIcon,
  EmailIcon,
  PhoneIcon,
  PinIcon,
  TruckIcon,
} from '@/components/shared/Icons';

const formatCnpj = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

const formatPhone = (raw: string) => {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export default observer(function FornecedorDetailScreen() {
  const { width } = useWindowDimensions();
  const isWeb = width >= 768;
  const theme = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  useEffect(() => {
    dataStore.refreshSuppliers();
    dataStore.refreshStock();
  }, []);

  const item = dataStore.suppliers.find((s) => s.id === id);

  if (!item) {
    return (
      <View
        style={[
          styles.notFoundContainer,
          { backgroundColor: theme.background },
        ]}
      >
        <TruckIcon color={theme.contrast} size={48} />
        <Text style={[styles.notFoundTitle, { color: theme.text }]}>
          Fornecedor não encontrado
        </Text>
        <Text
          style={[styles.notFoundSub, { color: theme.text, opacity: 0.6 }]}
        >
          O fornecedor que você está tentando visualizar não existe ou foi
          removido.
        </Text>
        <TouchableOpacity
          style={[
            styles.notFoundBtn,
            { backgroundColor: theme.foreground },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={20} />
          <Text style={[styles.notFoundBtnText, { color: theme.text }]}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const linkedIngredients = dataStore.ingredients.filter(
    (i) => i.supplierId === item.id
  );

  const hasAddress =
    !!item.address &&
    (!!item.address.street ||
      !!item.address.number ||
      !!item.address.city ||
      !!item.address.state);

  const statusColor = item.isActive ? '#10B981' : '#9CA3AF';
  const statusBg = item.isActive ? '#10B98122' : '#9CA3AF22';
  const statusLabel = item.isActive ? 'Ativo' : 'Inativo';

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        { backgroundColor: theme.background },
        isWeb && { maxWidth: 720, alignSelf: 'center', width: '100%' },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backArrowBtn, { backgroundColor: theme.foreground }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon color={theme.text} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Visualização do Fornecedor
          </Text>
          <Text
            style={[styles.headerSub, { color: theme.text, opacity: 0.5 }]}
            numberOfLines={1}
          >
            Detalhes e itens vinculados
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: theme.foreground }]}
          onPress={() =>
            router.push({
              pathname: 'fornecedores/addItem' as any,
              params: { id: item.id },
            })
          }
          activeOpacity={0.7}
        >
          <EditIcon color={theme.contrast} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.nameRow}>
        <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <View
          style={[styles.statusBadge, { backgroundColor: statusBg }]}
        >
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {item.contactName ? (
        <Text style={[styles.contactLine, { color: theme.text }]}>
          Contato: {item.contactName}
        </Text>
      ) : null}

      {(item.phone || item.email || item.cnpj) ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Informações de Contato
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.foreground },
            ]}
          >
            {item.phone ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View
                  style={[
                    styles.infoIconBox,
                    { backgroundColor: theme.contrast + '22' },
                  ]}
                >
                  <PhoneIcon color={theme.contrast} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.infoLabel, { color: theme.text }]}
                  >
                    Telefone
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.text }]}
                  >
                    {formatPhone(item.phone)}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.email ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View
                  style={[
                    styles.infoIconBox,
                    { backgroundColor: theme.contrast + '22' },
                  ]}
                >
                  <EmailIcon color={theme.contrast} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.infoLabel, { color: theme.text }]}
                  >
                    E-mail
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {item.email}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.cnpj ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View
                  style={[
                    styles.infoIconBox,
                    { backgroundColor: theme.contrast + '22' },
                  ]}
                >
                  <BuildingIcon color={theme.contrast} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.infoLabel, { color: theme.text }]}
                  >
                    CNPJ
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.text }]}
                  >
                    {formatCnpj(item.cnpj)}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      {hasAddress && item.address ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Endereço
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.foreground },
            ]}
          >
            {item.address.street ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>
                    Logradouro
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {item.address.street}
                    {item.address.number
                      ? `, ${item.address.number}`
                      : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.address.neighborhood ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>
                    Bairro
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {item.address.neighborhood}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.address.city || item.address.state ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>
                    Cidade / UF
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {item.address.city || '—'}
                    {item.address.state
                      ? ` / ${item.address.state.toUpperCase()}`
                      : ''}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.address.zipCode ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>
                    CEP
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {item.address.zipCode}
                  </Text>
                </View>
              </View>
            ) : null}

            {item.address.complement ? (
              <View
                style={[
                  styles.infoRow,
                  { backgroundColor: theme.background },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>
                    Complemento
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.text }]}>
                    {item.address.complement}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        </>
      ) : null}

      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Itens Vinculados
      </Text>
      <View
        style={[styles.infoCard, { backgroundColor: theme.foreground }]}
      >
        {linkedIngredients.length > 0 ? (
          <View style={styles.linkedList}>
            {linkedIngredients.map((ing) => (
              <TouchableOpacity
                key={ing.id}
                style={[
                  styles.linkedItem,
                  { backgroundColor: theme.background },
                ]}
                activeOpacity={0.7}
                onPress={() => router.push(`estoque/${ing.id}` as any)}
              >
                <View
                  style={[
                    styles.linkedDot,
                    { backgroundColor: theme.contrast },
                  ]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.linkedName, { color: theme.text }]}
                  >
                    {ing.name}
                  </Text>
                  <Text
                    style={[styles.linkedMeta, { color: theme.text }]}
                  >
                    {ing.stock} {ing.unit} em estoque
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text
            style={[
              styles.emptyLinked,
              { color: theme.text, opacity: 0.5 },
            ]}
          >
            Nenhum item de estoque vinculado a este fornecedor.
          </Text>
        )}
        {linkedIngredients.length > 0 ? (
          <Text
            style={[styles.linkedFooter, { color: theme.text }]}
          >
            {linkedIngredients.length} item
            {linkedIngredients.length !== 1 ? 's' : ''} vinculado
            {linkedIngredients.length !== 1 ? 's' : ''}
          </Text>
        ) : null}
      </View>

      {item.notes && item.notes.trim() ? (
        <>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Observações
          </Text>
          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.foreground },
            ]}
          >
            <Text
              style={[styles.notesText, { color: theme.text }]}
            >
              {item.notes}
            </Text>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  backArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 18,
  },
  headerSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  itemName: {
    fontFamily: 'Jost_700Bold',
    fontSize: 24,
    flex: 1,
    minWidth: 200,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontFamily: 'Jost_700Bold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactLine: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 14,
    opacity: 0.6,
    marginLeft: 4,
    marginTop: 12,
    marginBottom: 12,
  },
  infoCard: {
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  linkedList: {
    gap: 6,
  },
  linkedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  linkedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linkedName: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
  linkedMeta: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  linkedFooter: {
    fontFamily: 'Jost_400Regular',
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyLinked: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  notesText: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    padding: 14,
  },
  notFoundContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontFamily: 'Jost_700Bold',
    fontSize: 20,
    marginTop: 16,
  },
  notFoundSub: {
    fontFamily: 'Jost_400Regular',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notFoundBtnText: {
    fontFamily: 'Jost_600SemiBold',
    fontSize: 14,
  },
});
