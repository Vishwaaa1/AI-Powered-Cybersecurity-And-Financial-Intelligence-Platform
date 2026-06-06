def calculate_splits(data):
    people = data['people']
    expenses = data['expenses']

    balances = {person: 0 for person in people}
    for expense in expenses:
        payer = expense['payer']
        amount = float(expense['amount'])
        split = expense['split']
        num_people = len(split)
        per_head = amount / num_people

        balances[payer] += amount
        for person in split:
            balances[person] -= per_head

    # Debt simplification
    settlements = []
    creditors = [(k, v) for k, v in balances.items() if v > 0]
    debtors = [(k, -v) for k, v in balances.items() if v < 0]

    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        debtor, debt_amt = debtors[i]
        creditor, credit_amt = creditors[j]
        paid = min(debt_amt, credit_amt)

        settlements.append({'from': debtor, 'to': creditor, 'amount': round(paid, 2)})
        debtors[i] = (debtor, debt_amt - paid)
        creditors[j] = (creditor, credit_amt - paid)

        if debtors[i][1] == 0: i += 1
        if creditors[j][1] == 0: j += 1

    return {'settlements': settlements}
