import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { IN_APP_NETWORKS, useInAppWallet } from '../../controllers/InAppWallet';
import { useDappContract } from '../../controllers/useDappContract';
import { formatEth, shortAddress } from '../../models/format';
import { RequireWallet } from '../components/RequireWallet';
import { Button, Card, Field, Muted, Row, Screen, StatusMessage, colors } from '../components/ui';

const HISTORY_LIMIT = 10;

export default function ContractScreen() {
  return (
    <RequireWallet>
      <ContractFunctions />
    </RequireWallet>
  );
}

function ContractFunctions() {
  const dapp = useDappContract();
  const { state, symbol } = dapp;

  const [newMessage, setNewMessage] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  if (!dapp.contractAddress) {
    return (
      <Screen>
        <Card title="Contract not deployed">
          <Muted>
            {`No DappContract address for ${dapp.network?.name} (chain ${dapp.chainId}).\n\n` +
              (dapp.chainId === '11155111'
                ? 'Deploy DappContract.sol on Sepolia from Remix (Injected Provider - MetaMask), then put the ' +
                  'contract address in mobile/.env as EXPO_PUBLIC_SEPOLIA_CONTRACT_ADDRESS and restart ' +
                  '"npx expo start --clear".'
                : 'In the contracts folder run "npm run node", then "npm run deploy:local", and reload the app.')}
          </Muted>
        </Card>
        <NetworkSwitch />
      </Screen>
    );
  }

  const eth = (wei: bigint) => `${formatEth(wei, 6)} ${symbol}`;

  return (
    <Screen refreshing={dapp.loading} onRefresh={dapp.refresh}>
      <Card title="DappContract">
        <Row label="Address" value={shortAddress(dapp.contractAddress, 6)} mono />
        <Row label="Network" value={dapp.network?.name} />
      </Card>
      <NetworkSwitch />

      <Card title="Read">
        <Row label="message()" value={state ? `"${state.message}"` : '…'} />
        <Row label="counter()" value={state?.counter.toString() ?? '…'} />
        <Row label="totalDeposits()" value={state ? eth(state.totalDeposits) : '…'} />
        <StatusMessage status={dapp.readError ? { kind: 'error', text: dapp.readError } : undefined} />
        <Button title="Refresh" variant="secondary" loading={dapp.loading} onPress={dapp.refresh} />
      </Card>

      <Card title="Account summary">
        <Row label="Balance in contract" value={state ? eth(state.summary.balance) : '…'} />
        <Row label="Total deposited" value={state ? eth(state.summary.deposited) : '…'} />
        <Row label="Total withdrawn" value={state ? eth(state.summary.withdrawn) : '…'} />
        <Row label="Transactions" value={state?.summary.transactions.toString() ?? '…'} />
      </Card>

      <Card title="Transaction history">
        {state && state.history.length === 0 ? <Muted>No deposits or withdrawals yet.</Muted> : null}
        {state?.history.slice(0, HISTORY_LIMIT).map((tx, i) => (
          <View key={`${tx.blockNumber}-${i}`} style={historyStyles.item}>
            <View style={historyStyles.line}>
              <Text
                style={[
                  historyStyles.type,
                  { color: tx.transactionType === 'DEPOSIT' ? colors.success : colors.danger },
                ]}
              >
                {tx.transactionType}
              </Text>
              <Text style={historyStyles.amount}>
                {`${tx.transactionType === 'DEPOSIT' ? '+' : '−'}${eth(tx.amount)}`}
              </Text>
            </View>
            <Muted>{`Block ${tx.blockNumber} · ${new Date(Number(tx.timestamp) * 1000).toLocaleString()}`}</Muted>
          </View>
        ))}
        {state && state.history.length > HISTORY_LIMIT ? (
          <Muted>{`Showing latest ${HISTORY_LIMIT} of ${state.history.length}.`}</Muted>
        ) : null}
      </Card>

      <Card title="Write">
        <StatusMessage status={dapp.status} />
        {dapp.explorerUrl ? (
          <Button
            title="View last tx on explorer"
            variant="secondary"
            onPress={() => Linking.openURL(dapp.explorerUrl!)}
          />
        ) : null}

        <Field label="setMessage(string)" placeholder="gm" value={newMessage} onChangeText={setNewMessage} />
        <Button
          title="Set message"
          loading={dapp.pending}
          onPress={async () => {
            if (await dapp.setMessage(newMessage)) setNewMessage('');
          }}
        />

        <Button title="increment()" loading={dapp.pending} onPress={dapp.increment} />

        <Field
          label={`deposit() payable (${symbol})`}
          placeholder="0.01"
          keyboardType="decimal-pad"
          value={depositAmount}
          onChangeText={setDepositAmount}
        />
        <Button
          title="Deposit"
          loading={dapp.pending}
          onPress={async () => {
            if (await dapp.deposit(depositAmount)) setDepositAmount('');
          }}
        />

        <Field
          label={`withdraw(uint256) (${symbol})`}
          placeholder="0.01"
          keyboardType="decimal-pad"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
        />
        <Button
          title="Withdraw"
          loading={dapp.pending}
          onPress={async () => {
            if (await dapp.withdraw(withdrawAmount)) setWithdrawAmount('');
          }}
        />
      </Card>
    </Screen>
  );
}

const historyStyles = StyleSheet.create({
  item: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 2,
  },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  type: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  amount: { color: colors.text, fontSize: 15, fontWeight: '600' },
});

/** Which network the built-in wallet uses for this dApp. */
function NetworkSwitch() {
  const { network, setNetwork } = useInAppWallet();
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {IN_APP_NETWORKS.map((n) => (
        <View key={n.id} style={{ flex: 1 }}>
          <Button
            title={n.name}
            variant={n.id === network.id ? 'primary' : 'secondary'}
            onPress={() => setNetwork(n)}
          />
        </View>
      ))}
    </View>
  );
}
