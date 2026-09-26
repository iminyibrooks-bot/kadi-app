
// Dynamic win-condition & anti-deadlock evaluator for Kadi
function evaluateGameWinState(gameState) {
    for (let player of gameState.players) {
        if (player.hand.length === 0) {
            return {
                winner: player.name,
                status: 'VICTORY',
                message: `${player.name} cleared all cards and won the game!`
            };
        }
    }
    if (gameState.deck.length === 0 && gameState.penaltyStack === 0) {
        const sorted = [...gameState.players].sort((a, b) => a.hand.length - b.hand.length);
        return {
            winner: sorted[0].name,
            status: 'VICTORY_BY_LOWEST_CARDS',
            message: `Deck exhausted! ${sorted[0].name} wins with the fewest cards remaining.`
        };
    }
    return { winner: null, status: 'ONGOING' };
}
