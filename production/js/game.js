        // Add this at the very top of your <script> section, before game code
        window.addEventListener('error', function (e) {
            // Ignore browser extension errors
            if (e.message && e.message.includes('runtime.lastError')) {
                e.preventDefault();
                console.log('⚠️ Browser extension error caught and ignored');
                return false;
            }
        });

        // ============================================================================
        // GAME METADATA & BRANDING
        // ============================================================================
        console.log('%c🎮 HABIB PUNJA v2.5.0', 'color: #4CAF50; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3)');
        console.log('%c© 2025 AgeOfBotsGames LLC', 'color: #666; font-size: 12px;');
        console.log('%cWebsite: https://ageofbotsgames.com', 'color: #2196F3; font-size: 12px;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');
        console.log('%c⚠️ Game code is protected by copyright.', 'color: #FF9800; font-weight: bold;');
        console.log('%c⚠️ Unauthorized copying or distribution is prohibited.', 'color: #FF9800; font-weight: bold;');
        console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #999;');
        console.log(' ');

        // Game state
        let deck = [];
        let players = [];

        class Card {
            constructor(rank, suit) { this.rank = rank; this.suit = suit; this.id = Math.random().toString(36).substr(2, 9) }
            toString() { return `${this.rank}${this.suit}` }
            getValue() { if (this.rank === 'A') return 1; if (this.rank === 'J') return 11; if (this.rank === 'Q') return 12; if (this.rank === 'K') return 13; return parseInt(this.rank) }
            getColor() { return (this.suit === '♥' || this.suit === '♦') ? 'red' : 'black' }
            getPenaltyValue() { if (this.rank === 'A') return 20; if (['K', 'Q', 'J'].includes(this.rank)) return 15; return this.getValue() }
        }

        let game = null;
        let persistentScores = [0, 0, 0];

        class GameState {
            constructor(carryOverScores = false) {
                this.currentHand = 1; this.players = 3;

                this.startingPlayer = null;  // Will be set by draw
                this.currentPlayer = 0;      // Temporary, will be updated after draw

                // 🎯 v2.5.0: Track last card alerts to show only once per player
                this.lastCardAlertShown = [false, false, false];  // ← ADD THIS LINE

                this.deck = []; this.discardPile = [];
                this.playerHands = [[], [], []]; this.playerBuys = [3, 3, 3];
                this.publishedSequences = [[], [], []]; this.gamePhase = 'draw';
                this.selectedCards = [];
                this.playerScores = carryOverScores ? [...persistentScores] : [0, 0, 0];
                this.lastDiscard = null; this.justPublished = false;
                this.lastDiscardByPlayer = -1; this.aiJustPublished = [false, false, false];
                this.turnCounter = 0;
                this.buyWindow = { active: false, card: null, discardingPlayer: -1, buyWindowPlayer: -1, expiresAt: 0, timerInterval: null, pendingDeckDraw: null };
                this.lastAIDiscard = [null, null, null];
                this.aiPersonality = { 1: 'rabbit', 2: 'tortoise' };
                this.lastCardWarningShown = null;
                this.handReqs = {
                    1: { name: "Two Triples", seqs: ["triple", "triple"], cards: 10 },
                    2: { name: "Triple + Ladder", seqs: ["triple", "ladder"], cards: 10 },
                    3: { name: "Two Ladders", seqs: ["ladder", "ladder"], cards: 10 },
                    4: { name: "Three Triples", seqs: ["triple", "triple", "triple"], cards: 10 },
                    5: { name: "2 Triples + Ladder", seqs: ["triple", "triple", "ladder"], cards: 10 },
                    6: { name: "Triple + 2 Ladders", seqs: ["triple", "ladder", "ladder"], cards: 10 },
                    7: { name: "Three Ladders", seqs: ["ladder", "ladder", "ladder"], cards: 10 }
                };
                this.initDeck(); this.deal(); this.updateUI();
                console.log('%c====== GAME STARTED ======', 'color:#28a745;font-size:14px;font-weight:bold');
            }

            getAIPersonality(aiIdx) {
                if (this.currentHand <= 3) return this.aiPersonality[aiIdx] || 'neutral';
                const aiScore = this.playerScores[aiIdx];
                const otherScores = this.playerScores.filter((_, idx) => idx !== aiIdx);
                const minOtherScore = Math.min(...otherScores);
                const maxOtherScore = Math.max(...otherScores);
                if (aiScore >= maxOtherScore && aiScore > minOtherScore + 20) return 'rabbit';
                if (aiScore <= minOtherScore) return 'tortoise';
                return this.aiPersonality[aiIdx] || 'neutral';
            }

            // ============================================
            // 🎴 v2.5.0: DRAW FOR FIRST TURN (Bridge Style)
            // ============================================
            async drawForFirstTurn() {
                console.log(`%c🎴 DRAW FOR FIRST TURN`, 'color: #9c27b0; font-weight: bold; font-size: 16px;');
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: #9c27b0;');

                // ═══════════════════════════════════════
                // PHASE 1: Opening Banter
                // ═══════════════════════════════════════
                const banter = getOpeningBanter();

                // Habot speaks first (aggressive/eager)
                await showInfoModal(
                    '💬 Habot',
                    banter[0].text,
                    'Continue',
                    '🐇',
                    true,   // Auto-fade
                    2000    // 2 seconds
                );

                // Jabot responds (calm/measured)
                await showInfoModal(
                    '💬 Jabot',
                    banter[1].text,
                    'Continue',
                    '🐢',
                    true,   // Auto-fade
                    2000    // 2 seconds
                );

                // ═══════════════════════════════════════
                // PHASE 2: The Draw
                // ═══════════════════════════════════════
                this.initDeck();

                const drawnCards = [
                    this.deck.pop(),  // Human (Player 0)
                    this.deck.pop(),  // Habot (Player 1)
                    this.deck.pop()   // Jabot (Player 2)
                ];

                console.log(`%c  Cards drawn:`, 'color: #9c27b0; font-weight: bold;');
                console.log(`    Human: ${drawnCards[0].toString()}`);
                console.log(`    Habot: ${drawnCards[1].toString()}`);
                console.log(`    Jabot: ${drawnCards[2].toString()}`);

                // Show draws with dramatic timing
                await showInfoModal(
                    '🎴 Habot Draws',
                    `Habot draws...\n\n${drawnCards[1].toString()}`,
                    'Continue',
                    '🐇',
                    true,
                    1800
                );

                await showInfoModal(
                    '🎴 Jabot Draws',
                    `Jabot draws...\n\n${drawnCards[2].toString()}`,
                    'Continue',
                    '🐢',
                    true,
                    1800
                );

                await showInfoModal(
                    '🎴 Your Draw',
                    `You draw...\n\n${drawnCards[0].toString()}`,
                    'Got it!',
                    '🃏',
                    false  // Must acknowledge
                );

                // ═══════════════════════════════════════
                // PHASE 3: Determine Winner
                // ═══════════════════════════════════════
                const suitOrder = { '♠': 4, '♥': 3, '♦': 2, '♣': 1 };

                const cardValues = drawnCards.map((card, idx) => ({
                    player: idx,
                    card: card,
                    value: card.getValue(),
                    suitValue: suitOrder[card.suit]
                }));

                // Sort by rank first, then by suit
                cardValues.sort((a, b) => {
                    if (b.value !== a.value) return b.value - a.value;
                    return b.suitValue - a.suitValue;
                });

                const winner = cardValues[0].player;
                const highestValue = cardValues[0].value;
                const tiedPlayers = cardValues.filter(cv => cv.value === highestValue);

                // ═══════════════════════════════════════
                // PHASE 4: Handle Ties (Show Hierarchy)
                // ═══════════════════════════════════════
                if (tiedPlayers.length > 1) {
                    console.log(`%c  🔄 TIE DETECTED! Multiple ${cardValues[0].card.rank}s drawn`, 'color: #ff9800; font-weight: bold;');

                    const tiedNames = tiedPlayers.map(cv => ['You', 'Habot', 'Jabot'][cv.player]).join(', ');
                    const tiedCards = tiedPlayers.map(cv => `${['You', 'Habot', 'Jabot'][cv.player]}: ${cv.card.toString()}`).join('\n');

                    // Show tie with suit hierarchy explanation
                    const suitInfo = getSuitExplanation();
                    await showInfoModal(
                        '🔄 Tie Detected!',
                        `${tiedNames} all drew ${cardValues[0].card.rank}!\n\n${tiedCards}\n\n${suitInfo.message}`,
                        'Continue',
                        '🎴',
                        true,   // Auto-fade
                        4000    // 4 seconds - enough time to read
                    );

                    console.log(`%c  ✅ Suit hierarchy: ${drawnCards[winner].suit} wins`, 'color: #4caf50; font-weight: bold;');
                }

                // ═══════════════════════════════════════
                // PHASE 5: Announce Winner with Reactions
                // ═══════════════════════════════════════
                const playerNames = ['You', 'Habot', 'Jabot'];
                const winnerName = playerNames[winner];
                const winnerCard = drawnCards[winner];

                const reactions = getWinReaction(winner, winnerCard, drawnCards);

                console.log(`%c  🏆 WINNER: ${winnerName} (${winnerCard.toString()})`, 'color: #ffd700; font-weight: bold; font-size: 14px;');

                // Show winner announcement
                let winnerMessage = `${winnerName} drew the highest card!\n\n${winnerCard.toString()}\n\n`;

                // Add summary of all draws
                winnerMessage += `━━━━━━━━━━━━━━━\n`;
                winnerMessage += `Habot: ${drawnCards[1].toString()}\n`;
                winnerMessage += `Jabot: ${drawnCards[2].toString()}\n`;
                winnerMessage += `You: ${drawnCards[0].toString()}\n`;
                winnerMessage += `━━━━━━━━━━━━━━━\n\n`;
                winnerMessage += `${winnerName} will start first!`;

                await showInfoModal(
                    '🏆 Starting Player',
                    winnerMessage,
                    'Continue',
                    '👑',
                    false  // Must acknowledge
                );

                // Show winner's reaction
                await showInfoModal(
                    winner === 0 ? '💬 The Table' : `💬 ${winnerName}`,
                    reactions.winner,
                    'Continue',
                    winner === 1 ? '🐇' : (winner === 2 ? '🐢' : '🎴'),
                    true,
                    2500
                );

                // Show loser reactions (if any)
                for (let loser of reactions.losers) {
                    await showInfoModal(
                        `💬 ${loser.speaker}`,
                        loser.text,
                        'Continue',
                        loser.speaker === 'Habot' ? '🐇' : '🐢',
                        true,
                        2000
                    );
                }

                // ═══════════════════════════════════════
                // PHASE 6: Reshuffle & Ready to Play
                // ═══════════════════════════════════════
                drawnCards.forEach(card => this.deck.push(card));
                this.initDeck();  // Fresh shuffle

                console.log(`%c  ♻️  Cards returned to deck, reshuffled`, 'color: #9c27b0;');
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: #9c27b0;');

                return winner;
            }

            initDeck() {
                const suits = ['♠', '♥', '♦', '♣'];
                const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
                this.deck = [];
                for (let d = 0; d < 2; d++) {
                    for (let suit of suits) {
                        for (let rank of ranks) {
                            this.deck.push(new Card(rank, suit));
                        }
                    }
                }
                for (let i = this.deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
                }
            }

            isTripleHeavyHand() {
                const req = this.handReqs[this.currentHand].seqs;
                const tripleCount = req.filter(s => s === 'triple').length;
                const ladderCount = req.filter(s => s === 'ladder').length;
                return tripleCount > 0 && (ladderCount === 0 || tripleCount >= ladderCount);
            }

            deal() {
                // 🎯 v2.5.0: Reset last card alerts for new hand
                this.lastCardAlertShown = [false, false, false];

                const cards = this.handReqs[this.currentHand].cards;
                for (let i = 0; i < cards; i++) {
                    for (let p = 0; p < this.players; p++) {
                        if (this.deck.length > 0) this.playerHands[p].push(this.deck.pop());
                    }
                }

                // 🎴 v2.5.0: Flip initial discard card with commentary
                if (this.deck.length > 0) {
                    const initialDiscard = this.deck.pop();
                    this.discardPile.push(initialDiscard);

                    console.log(`%c🎴 Initial discard card: ${initialDiscard.toString()}`, 'color: #ff9800; font-weight: bold;');

                    // Add character commentary based on card value
                    let commentary = '';
                    const rank = initialDiscard.rank;

                    if (['A', 'K', 'Q'].includes(rank)) {
                        commentary = 'Habot: "Interesting start... that\'s a valuable card."\nJabot: "Indeed. The first player has a decision to make."';
                    } else if (['J', '10', '9'].includes(rank)) {
                        commentary = 'Jabot: "A reasonable starting card."\nHabot: "Could fit into several sequences."';
                    } else {
                        commentary = 'Habot: "Low card on the pile - probably not worth the buy."\nJabot: "We shall see. Every card has its place."';
                    }

                    showInfoModal(
                        '🎴 Starting Card',
                        `The discard pile begins with:\n\n${initialDiscard.toString()}\n\n━━━━━━━━━━━━━━━\n${commentary}\n━━━━━━━━━━━━━━━\n\nFirst player may take it or draw from deck.`,
                        'Start Playing!',
                        '🃏',
                        true,
                        4000  // 4 seconds
                    );
                }

                // 🎯 v2.5.0: Smart initial sort based on game type
                const currentReq = this.handReqs[this.currentHand].seqs;
                const hasLadders = currentReq.some(seq => seq === 'ladder');
                const hasOnlyTriples = currentReq.every(seq => seq === 'triple');

                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: #2196f3;');
                console.log(`%c🃏 SORTING Hand ${this.currentHand}`, 'color: #2196f3; font-weight: bold; font-size: 14px;');
                console.log(`   Requirements: ${JSON.stringify(currentReq)}`);
                console.log(`   Has ladders: ${hasLadders}`);
                console.log(`   Only triples: ${hasOnlyTriples}`);
                console.log(`   Cards before sort: ${this.playerHands[0].map(c => c.toString()).join(', ')}`);

                // Sort player hand directly (don't call global functions during initialization)
                if (hasOnlyTriples) {
                    console.log(`%c   → Applying QUANTITY sort`, 'color: #4caf50; font-weight: bold;');

                    // Count frequency of each rank
                    const counts = {};
                    this.playerHands[0].forEach(card => {
                        counts[card.rank] = (counts[card.rank] || 0) + 1;
                    });

                    console.log(`   → Rank counts:`, counts);

                    // Sort by quantity (descending), then by rank value
                    this.playerHands[0].sort((a, b) => {
                        const countDiff = counts[b.rank] - counts[a.rank];
                        if (countDiff !== 0) return countDiff;
                        if (a.getValue() !== b.getValue()) return a.getValue() - b.getValue();
                        return a.suit.localeCompare(b.suit);
                    });

                } else if (hasLadders) {
                    console.log(`%c   → Applying SUIT sort`, 'color: #4caf50; font-weight: bold;');

                    // Sort by suit, then by rank
                    const order = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
                    this.playerHands[0].sort((a, b) => {
                        if (order[a.suit] !== order[b.suit]) return order[a.suit] - order[b.suit];
                        return a.getValue() - b.getValue();
                    });

                } else {
                    console.log(`%c   → Applying RANK sort`, 'color: #4caf50; font-weight: bold;');

                    // Sort by rank value, then by suit
                    this.playerHands[0].sort((a, b) => {
                        if (a.getValue() !== b.getValue()) return a.getValue() - b.getValue();
                        return a.suit.localeCompare(b.suit);
                    });
                }

                console.log(`   Cards after sort: ${this.playerHands[0].map(c => c.toString()).join(', ')}`);
                console.log(`%c✅ Sort complete!`, 'color: #00ff00; font-weight: bold;');
                console.log(`%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'color: #2196f3;');

                this.selectedCards = [];
            }


            reshuffleDeck() {
                if (this.discardPile.length <= 1) { console.log('%cNo cards to reshuffle', 'color: #ffc107;'); return false }
                const topCard = this.discardPile.pop();
                this.deck = [...this.discardPile];
                this.discardPile = [topCard];
                for (let i = this.deck.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
                }
                console.log(`%cReshuffled ${this.deck.length} cards`, 'color: #ffc107; font-weight: bold;');
                return true;
            }

            isValidTriple(cards) { if (cards.length !== 3) return false; return cards.every(c => c.rank === cards[0].rank) }

            isValidLadder(cards) {
                if (cards.length !== 4) return false;
                if (!cards.every(c => c.suit === cards[0].suit)) return false;
                const values = cards.map(c => c.getValue());
                if (values.includes(1) && values.includes(13) && values.includes(12) && values.includes(11)) return true;
                const sorted = [...values].sort((a, b) => a - b);
                for (let i = 1; i < sorted.length; i++) { if (sorted[i] !== sorted[i - 1] + 1) return false }
                return true;
            }

            isLadderHand() { return [2, 3, 5, 6, 7].includes(this.currentHand) }

            hasThreeCardLadderProgress(hand) {
                const bySuit = {};
                hand.forEach(c => { if (!bySuit[c.suit]) bySuit[c.suit] = []; bySuit[c.suit].push(c) });
                return Object.values(bySuit).some(cards => {
                    if (cards.length < 3) return false;
                    const uniqueByRank = [];
                    const seenRanks = new Set();
                    cards.sort((a, b) => a.getValue() - b.getValue());
                    cards.forEach(card => { if (!seenRanks.has(card.rank)) { uniqueByRank.push(card); seenRanks.add(card.rank) } });
                    for (let i = 0; i < uniqueByRank.length - 2; i++) {
                        if (uniqueByRank[i + 1].getValue() === uniqueByRank[i].getValue() + 1 &&
                            uniqueByRank[i + 2].getValue() === uniqueByRank[i + 1].getValue() + 1) return true;
                    }
                    return false;
                });
            }

            getPublishedRanks(playerIdx) { const ranks = new Set(); this.publishedSequences[playerIdx].forEach(c => ranks.add(c.rank)); return ranks }
            getPublishedSuits(playerIdx) { const suits = new Set(); this.publishedSequences[playerIdx].forEach(c => suits.add(c.suit)); return suits }

            getPublishProgress() {
                const req = this.handReqs[this.currentHand].seqs;
                const needTriples = req.filter(s => s === 'triple').length;
                const needLadders = req.filter(s => s === 'ladder').length;
                const seqs = this.findSequences(this.playerHands[0]);
                const hasTriples = seqs.triples.length;
                const hasLadders = seqs.ladders.length;
                return { needTriples, hasTriples, needLadders, hasLadders, canPublish: hasTriples >= needTriples && hasLadders >= needLadders };
            }

            findSequences(hand) {
                const seqs = { triples: [], ladders: [] };
                const byRank = {};
                hand.forEach(c => { if (!byRank[c.rank]) byRank[c.rank] = []; byRank[c.rank].push(c) });


                Object.values(byRank).forEach(g => {
                    if (g.length >= 3) {
                        // ✅ FIX 1C: Generate ALL combinations of 3 cards (not just sliding windows)
                        for (let i = 0; i < g.length - 2; i++) {
                            for (let j = i + 1; j < g.length - 1; j++) {
                                for (let k = j + 1; k < g.length; k++) {
                                    seqs.triples.push([g[i], g[j], g[k]]);
                                }
                            }
                        }
                    }
                });


                const bySuit = {};
                hand.forEach(c => { if (!bySuit[c.suit]) bySuit[c.suit] = []; bySuit[c.suit].push(c) });
                Object.values(bySuit).forEach(g => {
                    if (g.length >= 4) {
                        const hasAce = g.find(c => c.rank === 'A');
                        const hasK = g.find(c => c.rank === 'K');
                        const hasQ = g.find(c => c.rank === 'Q');
                        const hasJ = g.find(c => c.rank === 'J');
                        if (hasAce && hasK && hasQ && hasJ) seqs.ladders.push([hasAce, hasK, hasQ, hasJ]);
                        const uniqueByRank = [];
                        const seenRanks = new Set();
                        g.sort((a, b) => a.getValue() - b.getValue());
                        g.forEach(card => { if (!seenRanks.has(card.rank)) { uniqueByRank.push(card); seenRanks.add(card.rank) } });
                        for (let i = 0; i <= uniqueByRank.length - 4; i++) {
                            const ladder = uniqueByRank.slice(i, i + 4);
                            if (this.isValidLadder(ladder)) seqs.ladders.push(ladder);
                        }
                    }
                });
                return seqs;
            }

            canPublish(pIdx) {
                const hand = this.playerHands[pIdx];
                const req = this.handReqs[this.currentHand].seqs;
                const needTriples = req.filter(s => s === 'triple').length;
                const needLadders = req.filter(s => s === 'ladder').length;
                const byRank = {};
                hand.forEach(c => { if (!byRank[c.rank]) byRank[c.rank] = []; byRank[c.rank].push(c) });
                const tripleRanks = Object.keys(byRank).filter(rank => byRank[rank].length >= 3);
                if (tripleRanks.length < needTriples) return false;
                const tryPublish = (tripleAssignments, triplesAssigned, usedIds, startRankIdx = 0) => {
                    if (triplesAssigned === needTriples) {
                        let laddersFound = 0; const usedForLadders = new Set(usedIds);
                        for (let i = 0; i < needLadders; i++) {
                            const remaining = hand.filter(c => !usedForLadders.has(c.id));
                            const testSeqs = this.findSequences(remaining);
                            if (testSeqs.ladders.length === 0) break;
                            testSeqs.ladders[0].forEach(c => usedForLadders.add(c.id));
                            laddersFound++;
                        }
                        return laddersFound >= needLadders;
                    }
                    for (let rankIdx = startRankIdx; rankIdx < tripleRanks.length; rankIdx++) {
                        const rank = tripleRanks[rankIdx];
                        const cards = byRank[rank];
                        if (cards.length >= 4) {
                            for (let i = 0; i < cards.length - 2; i++) {
                                for (let j = i + 1; j < cards.length - 1; j++) {
                                    for (let k = j + 1; k < cards.length; k++) {
                                        const newUsed = new Set(usedIds);
                                        newUsed.add(cards[i].id); newUsed.add(cards[j].id); newUsed.add(cards[k].id);
                                        if (tryPublish(tripleAssignments, triplesAssigned + 1, newUsed, rankIdx + 1)) return true;
                                    }
                                }
                            }
                        } else {
                            const newUsed = new Set(usedIds);
                            cards.slice(0, 3).forEach(c => newUsed.add(c.id));
                            if (tryPublish(tripleAssignments, triplesAssigned + 1, newUsed, rankIdx + 1)) return true;
                        }
                    }
                    return false;
                };
                return tryPublish([], 0, new Set());
            }

            autoPublish(pIdx) {
                // 🛡️ FIX 6: CRITICAL - Block republishing!
                if (this.publishedSequences[pIdx].length > 0) {
                    console.log(`⏭️ FIX 6: Player ${pIdx} already has ${this.publishedSequences[pIdx].length} published cards - blocking republish`);
                    return false;
                }

                const req = this.handReqs[this.currentHand].seqs;
                const hand = this.playerHands[pIdx];
                const opponentRanks = new Set();

                const opponentSuits = new Set();
                for (let i = 0; i < this.players; i++) {
                    if (i !== pIdx) {
                        this.getPublishedRanks(i).forEach(r => opponentRanks.add(r));
                        this.getPublishedSuits(i).forEach(s => opponentSuits.add(s));
                    }
                }
                let published = [];
                const usedCardIds = new Set();
                let triplesPublished = 0;
                let laddersPublished = 0;
                const triplesNeeded = req.filter(s => s === 'triple').length;
                const laddersNeeded = req.filter(s => s === 'ladder').length;
                while (triplesPublished < triplesNeeded) {
                    const availableHand = hand.filter(c => !usedCardIds.has(c.id));
                    const byRank = {};
                    availableHand.forEach(c => { if (!byRank[c.rank]) byRank[c.rank] = []; byRank[c.rank].push(c) });
                    const ranks = Object.keys(byRank).filter(rank => byRank[rank].length >= 3).sort((a, b) => {
                        const aOverlap = opponentRanks.has(a) ? 1 : 0;
                        const bOverlap = opponentRanks.has(b) ? 1 : 0;
                        if (aOverlap !== bOverlap) return aOverlap - bOverlap;
                        return parseInt(a === 'A' ? 1 : a === 'J' ? 11 : a === 'Q' ? 12 : a === 'K' ? 13 : a) -
                            parseInt(b === 'A' ? 1 : b === 'J' ? 11 : b === 'Q' ? 12 : b === 'K' ? 13 : b);
                    });
                    if (ranks.length === 0) break;
                    const rank = ranks[0];
                    const cards = byRank[rank];
                    if (cards.length >= 4) {
                        published = published.concat(cards.slice(0, 3));
                        cards.slice(0, 3).forEach(c => usedCardIds.add(c.id));
                    } else {
                        published = published.concat(cards.slice(0, 3));
                        cards.slice(0, 3).forEach(c => usedCardIds.add(c.id));
                    }
                    triplesPublished++;
                }
                while (laddersPublished < laddersNeeded) {
                    const availableHand = hand.filter(c => !usedCardIds.has(c.id));
                    const seqs = this.findSequences(availableHand);
                    if (seqs.ladders.length === 0) break;
                    seqs.ladders.sort((a, b) => {
                        const aOverlap = opponentSuits.has(a[0].suit) ? 1 : 0;
                        const bOverlap = opponentSuits.has(b[0].suit) ? 1 : 0;
                        if (aOverlap !== bOverlap) return aOverlap - bOverlap;
                        return a[0].getValue() - b[0].getValue();
                    });
                    const ladder = seqs.ladders[0];
                    published = published.concat(ladder);
                    ladder.forEach(c => usedCardIds.add(c.id));
                    laddersPublished++;
                }
                if (triplesPublished < triplesNeeded || laddersPublished < laddersNeeded) return false;
                published.forEach(c => {
                    const idx = this.playerHands[pIdx].findIndex(card => card.id === c.id);
                    if (idx > -1) this.playerHands[pIdx].splice(idx, 1);
                });
                this.publishedSequences[pIdx] = published;

                // ← ADD THESE TWO LINES HERE:
                this.renderAIHands();
                this.renderPublished();

                return true;
            }

            // ✅ FIX 1: Explicit LOW and HIGH end ladder extension support
            canCardExtendLadder(cardVal, ladderValues) {
                const sorted = [...ladderValues].sort((a, b) => a - b);
                const minVal = sorted[0];
                const maxVal = sorted[sorted.length - 1];

                console.log(`  🔍 FIX 1: Checking if ${cardVal} can extend ladder [${sorted.join(',')}]`);

                // Check for wrap-around ladder (A-K-Q-J)
                const hasAce = sorted.includes(1);
                const hasKing = sorted.includes(13);
                const hasQueen = sorted.includes(12);
                const hasJack = sorted.includes(11);
                const isWrapAroundLadder = hasAce && hasJack && hasQueen && hasKing;

                if (isWrapAroundLadder) {
                    if (cardVal === 1) return false; // No duplicate Ace
                    const nonAceValues = sorted.filter(v => v !== 1);
                    const lowEnd = Math.min(...nonAceValues);
                    const canExtend = cardVal === lowEnd - 1;
                    console.log(`  ✅ FIX 1: Wrap-around ladder - Can extend LOW: ${canExtend}`);
                    return canExtend;
                }

                // ✅ FIX 7: Special case - Ace can extend after King (K-A wrap)
                if (cardVal === 1 && maxVal === 13) {
                    console.log(`  ✅ FIX 7: ACE after KING wrap: true`);
                    return true;
                }

                // ✅ FIX 1: Normal ladders - EXPLICIT support for BOTH ends
                const canExtendLow = (cardVal === minVal - 1);
                const canExtendHigh = (cardVal === maxVal + 1);

                console.log(`  ✅ FIX 1: LOW end (${minVal}-1=${minVal - 1}): ${canExtendLow}`);
                console.log(`  ✅ FIX 1: HIGH end (${maxVal}+1=${maxVal + 1}): ${canExtendHigh}`);

                return canExtendLow || canExtendHigh;
            }

            couldExtendSequence(card, playerIdx) {
                const published = this.publishedSequences[playerIdx];
                if (published.length === 0) return false;
                const req = this.handReqs[this.currentHand].seqs;
                const hasTriples = req.some(s => s === 'triple');
                const hasLadders = req.some(s => s === 'ladder');
                const publishedRankCounts = {};
                published.forEach(c => { publishedRankCounts[c.rank] = (publishedRankCounts[c.rank] || 0) + 1 });
                const hasActualTriples = Object.values(publishedRankCounts).some(count => count >= 3);
                const publishedSuits = {};
                published.forEach(c => { if (!publishedSuits[c.suit]) publishedSuits[c.suit] = []; publishedSuits[c.suit].push(c.getValue()) });
                const hasActualLadders = Object.values(publishedSuits).some(vals => vals.length >= 4);
                if (hasTriples || hasActualTriples) { if (publishedRankCounts[card.rank] >= 3) return true }

                if (hasLadders || hasActualLadders) {
                    // ✅ FIX 1B: Don't filter out "triple cards" - just get ALL cards of matching suit
                    // This handles cases where a rank appears in both triple and ladder (e.g., 8♦ 8♣ 8♦ + 7♥ 8♥ 9♥ 10♥)
                    const sameSuit = published.filter(c => c.suit === card.suit);

                    console.log(`  🔍 FIX 1B: Checking ${card.toString()} against ${sameSuit.length} published ${card.suit} cards`);

                    if (sameSuit.length >= 4) {
                        const cardVal = card.getValue();
                        const values = sameSuit.map(c => c.getValue()).sort((a, b) => a - b);
                        const ladders = []; let remainingValues = [...values];
                        const hasAce = values.includes(1); const hasJack = values.includes(11);
                        const hasQueen = values.includes(12); const hasKing = values.includes(13);
                        if (hasAce && hasJack && hasQueen && hasKing) {
                            ladders.push([1, 11, 12, 13]);
                            remainingValues = remainingValues.filter(v => ![1, 11, 12, 13].includes(v));
                        }
                        if (remainingValues.length >= 4) {
                            let currentLadder = [remainingValues[0]];
                            for (let i = 1; i < remainingValues.length; i++) {
                                if (remainingValues[i] === currentLadder[currentLadder.length - 1] + 1) {
                                    currentLadder.push(remainingValues[i]);
                                } else {
                                    if (currentLadder.length >= 4) { ladders.push([...currentLadder]) }
                                    currentLadder = [remainingValues[i]];
                                }
                            }
                            if (currentLadder.length >= 4) { ladders.push(currentLadder) }
                        }
                        const canExtend = ladders.some(ladder => {
                            return this.canCardExtendLadder(cardVal, ladder);
                        });
                        if (canExtend) return true;
                    }
                }

                return false;
            }

            canAddToPublishedSequence(card, publishedSequence) {
                // Check if card can be added to this published sequence
                const seq = publishedSequence.cards || publishedSequence;

                // For triples/quads - check if same rank
                if (seq.length >= 3 && seq.every(c => c.rank === seq[0].rank)) {
                    return card.rank === seq[0].rank;
                }

                // For runs - check if can extend at either end
                if (seq.length >= 3) {
                    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
                    const seqSuit = seq[0].suit;

                    if (card.suit !== seqSuit) return false;

                    const seqRanks = seq.map(c => c.rank);
                    const firstRank = seqRanks[0];
                    const lastRank = seqRanks[seqRanks.length - 1];

                    const firstIdx = ranks.indexOf(firstRank);
                    const lastIdx = ranks.lastIndexOf(lastRank);

                    // Can add before first card?
                    if (firstIdx > 0 && ranks[firstIdx - 1] === card.rank) return true;

                    // Can add after last card?
                    if (lastIdx < ranks.length - 1 && ranks[lastIdx + 1] === card.rank) return true;
                }

                return false;
            }

            evaluateCard(card, pIdx) {
                const hand = this.playerHands[pIdx];
                let val = 0;

                const sameRank = hand.filter(c => c.rank === card.rank).length;
                const sameSuit = hand.filter(c => c.suit === card.suit);

                // 🎯 PATCH L: Smart pair valuation based on game type
                const req = this.handReqs[this.currentHand].seqs;
                const hasOnlyTriples = req.every(s => s === 'triple');

                // Count existing pairs in hand
                const rankCounts = {};
                hand.forEach(c => rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1);
                const numPairs = Object.values(rankCounts).filter(count => count === 2).length;

                if (sameRank >= 2) {
                    // Already have 2+ of this rank - GREAT for triples!
                    val += 20;
                } else if (sameRank === 1) {
                    // Would CREATE a new pair
                    if (hasOnlyTriples && numPairs >= 4) {
                        // Triple game with 4+ pairs already - PENALIZE new pairs
                        console.log(`  → PATCH L: Penalizing ${card.toString()} - already have ${numPairs} pairs in triple game`);
                        val -= 10;  // Negative value = don't want this card
                    } else if (numPairs >= 2 && !hasOnlyTriples) {
                        // Mixed game with 2+ pairs - slight penalty
                        val += 3;  // Reduced from 8
                    } else {
                        // Normal pair value
                        val += 8;
                    }
                }

                if (sameSuit.length >= 3) {
                    const values = sameSuit.map(c => c.getValue());
                    const cardVal = card.getValue();
                    const allValues = [...values, cardVal].sort((a, b) => a - b);
                    let maxConsecutive = 1;
                    let currentConsecutive = 1;
                    for (let i = 1; i < allValues.length; i++) {
                        if (allValues[i] === allValues[i - 1] + 1) {
                            currentConsecutive++;
                            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
                        } else if (allValues[i] !== allValues[i - 1]) {
                            currentConsecutive = 1;
                        }
                    }
                    if (maxConsecutive >= 4) val += 25;
                    else if (maxConsecutive === 3) val += 15;
                    else if (maxConsecutive === 2) val += 5;
                } else if (sameSuit.length >= 2) {
                    const hasAdj = sameSuit.some(c => Math.abs(c.getValue() - card.getValue()) === 1);
                    if (hasAdj) val += 6;
                } else if (sameSuit.length === 1) {
                    const hasAdj = sameSuit.some(c => Math.abs(c.getValue() - card.getValue()) === 1);
                    if (hasAdj) val += 3;
                }
                if (this.publishedSequences[pIdx].length > 0) {
                    if (this.couldExtendSequence(card, pIdx)) val += 100;
                }
                for (let p = 0; p < this.players; p++) {
                    if (this.publishedSequences[p].length === 0) continue;
                    if (p === pIdx) continue;
                    const opponentHandSize = this.playerHands[p].length;
                    if (opponentHandSize <= 4 && this.couldExtendSequence(card, p)) {
                        val -= 30;
                    } else if (this.couldExtendSequence(card, p)) {
                        val += 30;
                    }
                }
                return val;
            }

            findWorstCard(pIdx) {
                const hand = this.playerHands[pIdx];

                // 🏆 PATCH G: CRITICAL - Check if AI can WIN by extending own sequences
                console.log(`  🏆 PATCH G: Checking if AI can win this turn`);

                const myPublished = this.publishedSequences[pIdx];
                if (myPublished && myPublished.length > 0 && hand.length <= 3) {
                    // Check if ANY card can extend my sequences and leave me with ≤1 cards
                    for (let card of hand) {
                        const canExtend = myPublished.some(pubSeq => this.canAddToPublishedSequence(card, pubSeq));

                        if (canExtend && hand.length === 2) {
                            // Playing this card wins the game!
                            console.log(`  🏆 CRITICAL: ${card.toString()} extends my sequence - WINNING MOVE! Keeping it!`);
                            // Return a DIFFERENT card (not the winning one)
                            const otherCards = hand.filter(c => c !== card);
                            if (otherCards.length > 0) {
                                console.log(`  🏆 Discarding ${otherCards[0].toString()} instead to keep winning card`);
                                return otherCards[0];
                            }
                        }
                    }
                }

                // 🎯 PATCH K: Enhanced danger detection - protect before publishing too
                console.log(`  → PATCH K: Checking danger with published sequences (expanded)`);
                for (let p = 0; p < this.players; p++) {
                    if (p === pIdx) continue; // Skip self
                    const opponentCards = this.playerHands[p].length;
                    const opponentPublished = this.publishedSequences[p].length > 0;
                    const iHavePublished = this.publishedSequences[pIdx].length > 0;

                    // SCENARIO 1: Critical endgame (original logic)
                    const criticalEndgame = opponentPublished && opponentCards <= 2;

                    // SCENARIO 2: I haven't published yet, opponent is mid-game threat
                    const midGameThreat = !iHavePublished && opponentPublished && opponentCards <= 4;

                    if (criticalEndgame || midGameThreat) {
                        const playerName = p === 0 ? 'Human' : (p === 1 ? 'Habot' : 'Jabot');
                        const scenario = criticalEndgame ? 'CRITICAL' : 'MID-GAME THREAT';
                        console.log(`  → PATCH K: ${scenario} - ${playerName} has ${opponentCards} card(s)${opponentPublished ? ' and published' : ''}!`);

                        // Filter out cards that help them (including via ANY published sequences)
                        const safeCards = hand.filter(c => {
                            // Check if extends opponent's hand
                            if (this.couldExtendSequence(c, p)) return false;

                            // Check if can be added to ANY published sequence (any player)
                            for (let player = 0; player < this.players; player++) {
                                const published = this.publishedSequences[player];
                                if (published && published.length > 0) {
                                    for (let pubSeq of published) {
                                        if (this.canAddToPublishedSequence(c, pubSeq)) {
                                            console.log(`  → PATCH K: ${c.toString()} can add to published sequence - NOT SAFE`);
                                            return false; // Not safe - can extend published
                                        }
                                    }
                                }
                            }
                            return true; // Safe - doesn't help via hand or published
                        });

                        if (safeCards.length > 0) {
                            // Discard highest penalty from safe cards
                            const worst = safeCards.reduce((max, c) =>
                                c.getPenaltyValue() > max.getPenaltyValue() ? c : max
                            );
                            console.log(`  → PATCH K: Safe discard: ${worst.toString()} (doesn't help ${playerName})`);
                            return worst;
                        } else {
                            console.log(`  → PATCH K: WARNING - ALL cards help ${playerName}! Using least valuable...`);
                            // If all cards help, pick the least strategically valuable
                            let minValue = this.evaluateCard(hand[0], pIdx);
                            let worst = hand[0];
                            hand.forEach(c => {
                                const val = this.evaluateCard(c, pIdx);
                                if (val < minValue) {
                                    minValue = val;
                                    worst = c;
                                }
                            });
                            return worst;
                        }
                    }
                }

                const isLadderOnlyHand = this.handReqs[this.currentHand].seqs.every(seq => seq === 'ladder');
                if (isLadderOnlyHand && this.turnCounter > 80 && hand.length >= 15) {
                    const potentialLadders = {};
                    hand.forEach(card => { if (!potentialLadders[card.suit]) potentialLadders[card.suit] = []; potentialLadders[card.suit].push(card.getValue()) });
                    const keepCards = new Set();
                    Object.entries(potentialLadders).forEach(([suit, values]) => {
                        const uniqueValues = [...new Set(values)].sort((a, b) => a - b);
                        for (let i = 0; i < uniqueValues.length; i++) {
                            let runLength = 1;
                            let currentValue = uniqueValues[i];
                            while (i + runLength < uniqueValues.length && uniqueValues[i + runLength] === currentValue + runLength) runLength++;
                            if (runLength >= 3) {
                                for (let k = 0; k < runLength; k++) {
                                    const cardValue = currentValue + k;
                                    const cardsWithValue = hand.filter(c => c.suit === suit && c.getValue() === cardValue);
                                    cardsWithValue.forEach(c => keepCards.add(c.id));
                                }
                            }
                        }
                    });
                    const dumpCandidates = hand.filter(c => !keepCards.has(c.id));
                    if (dumpCandidates.length > 0) {
                        const worst = dumpCandidates.reduce((max, c) => c.getPenaltyValue() > max.getPenaltyValue() ? c : max);
                        return worst;
                    }
                }
                const hasPublished = this.publishedSequences[pIdx].length > 0;
                if (!hasPublished) {
                    const othersPublished = this.publishedSequences.some((seq, idx) => idx !== pIdx && seq.length > 0);
                    const othersLowCards = this.playerHands.some((h, idx) => idx !== pIdx && h.length <= 2);
                    if (othersPublished && othersLowCards) {
                        if (this.turnCounter > 120) {
                            const highestPenalty = hand.reduce((max, card) => card.getPenaltyValue() > max.getPenaltyValue() ? card : max);
                            return highestPenalty;
                        }
                        const seqs = this.findSequences(hand);
                        const inSequences = new Set();
                        seqs.triples.forEach(t => t.forEach(c => inSequences.add(c.id)));
                        seqs.ladders.forEach(l => l.forEach(c => inSequences.add(c.id)));
                        const safeToDump = hand.filter(c => {
                            if (inSequences.has(c.id)) return false;
                            for (let p = 0; p < this.players; p++) {
                                if (p === pIdx) continue;
                                if (this.playerHands[p].length <= 2 && this.couldExtendSequence(c, p)) return false;
                            }
                            return true;
                        });
                        if (safeToDump.length > 0) {
                            const highPenalty = safeToDump.sort((a, b) => b.getPenaltyValue() - a.getPenaltyValue())[0];
                            return highPenalty;
                        }
                        const pairs = {};
                        hand.forEach(c => { pairs[c.rank] = (pairs[c.rank] || []); pairs[c.rank].push(c) });
                        const pairCards = [];
                        Object.entries(pairs).forEach(([rank, cards]) => { if (cards.length === 2) pairCards.push(...cards) });
                        if (pairCards.length > 0) {
                            const worst = pairCards.reduce((min, c) => c.getValue() < min.getValue() ? c : min);
                            return worst;
                        }
                        const notInSeq = hand.filter(c => !inSequences.has(c.id));
                        if (notInSeq.length > 0) {
                            const lowest = notInSeq.reduce((min, c) => c.getPenaltyValue() < min.getPenaltyValue() ? c : min);
                            return lowest;
                        }
                    }
                }
                const rankCounts = {};
                hand.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });
                const protectedCards = new Set();
                Object.entries(rankCounts).forEach(([rank, count]) => {
                    if (count >= 2) { hand.forEach(c => { if (c.rank === rank) protectedCards.add(c.id) }) }
                });
                if (this.publishedSequences[pIdx].length > 0) {
                    hand.forEach(c => { if (this.couldExtendSequence(c, pIdx)) protectedCards.add(c.id) });
                }
                const criticalDanger = new Set();
                const moderateDanger = new Set();
                for (let p = 0; p < this.players; p++) {
                    if (p === pIdx) continue;
                    if (this.publishedSequences[p].length === 0) continue;
                    const opponentCards = this.playerHands[p].length;
                    hand.forEach(c => {
                        if (this.couldExtendSequence(c, p)) {
                            if (opponentCards <= 2) { criticalDanger.add(c.id); protectedCards.add(c.id) }
                            else if (opponentCards <= 4) { moderateDanger.add(c.id); protectedCards.add(c.id) }
                        }
                    });
                }
                const safeCards = hand.filter(c => !protectedCards.has(c.id));
                if (safeCards.length > 0) {
                    let worst = safeCards[0];
                    let minVal = this.evaluateCard(worst, pIdx);
                    safeCards.forEach(c => {
                        const val = this.evaluateCard(c, pIdx);
                        if (val < minVal) { minVal = val; worst = c }
                    });
                    return worst;
                }
                const nonCriticalCards = hand.filter(c => !criticalDanger.has(c.id));
                if (nonCriticalCards.length > 0) {
                    const cardsNotExtendingOwn = [];
                    const cardsExtendingOwn = [];
                    nonCriticalCards.forEach(c => {
                        if (this.couldExtendSequence(c, pIdx)) cardsExtendingOwn.push(c);
                        else cardsNotExtendingOwn.push(c);
                    });
                    if (cardsNotExtendingOwn.length > 0) {
                        let worst = cardsNotExtendingOwn[0];
                        let minVal = this.evaluateCard(worst, pIdx);
                        cardsNotExtendingOwn.forEach(c => {
                            const val = this.evaluateCard(c, pIdx);
                            if (val < minVal) { minVal = val; worst = c }
                        });
                        return worst;
                    }
                    if (cardsExtendingOwn.length > 0) {
                        let worst = cardsExtendingOwn[0];
                        let minVal = this.evaluateCard(worst, pIdx);
                        cardsExtendingOwn.forEach(c => {
                            const val = this.evaluateCard(c, pIdx);
                            if (val < minVal) { minVal = val; worst = c }
                        });
                        return worst;
                    }
                }
                let leastUrgent = hand[0];
                let maxOpponentCards = 0;
                hand.forEach(c => {
                    for (let p = 0; p < this.players; p++) {
                        if (p === pIdx) continue;
                        if (this.couldExtendSequence(c, p)) {
                            const opponentCards = this.playerHands[p].length;
                            if (opponentCards > maxOpponentCards) { maxOpponentCards = opponentCards; leastUrgent = c }
                        }
                    }
                });
                if (maxOpponentCards === 0) {
                    let minVal = this.evaluateCard(leastUrgent, pIdx);
                    hand.forEach(c => {
                        const val = this.evaluateCard(c, pIdx);
                        if (val < minVal) { minVal = val; leastUrgent = c }
                    });
                }
                return leastUrgent;
            }

            shouldAllowBuy(ai, discardCard) {
                const buysRemaining = this.playerBuys[ai];
                if (buysRemaining === 0) return false;
                const hand = this.playerHands[ai];
                const buysUsed = (this.currentHand === 7 ? 2 : 3) - buysRemaining;
                const seqs = this.findSequences(hand);
                const hasTriple = seqs.triples.length > 0;
                const hasLadder = seqs.ladders.length > 0;
                const strategicValue = this.evaluateCard(discardCard, ai);
                const penaltyValue = discardCard.getPenaltyValue();
                const cardValue = strategicValue + penaltyValue;
                switch (this.currentHand) {
                    case 1: if (buysUsed >= 2) return false; if (!hasTriple && cardValue < 30) return false; return hasTriple || cardValue >= 30;
                    case 2: if (buysUsed >= 2) return false; const hasSequence = hasTriple || hasLadder; return hasSequence && cardValue >= 25;
                    case 3:
                        if (buysUsed < 2) return cardValue >= 35;
                        if (buysUsed === 2) { const has3CardProgress = this.hasThreeCardLadderProgress(hand); return has3CardProgress && cardValue >= 30 }
                        return false;
                    case 4: if (buysUsed >= 2) return false; return hasTriple && cardValue >= 25;
                    case 5: if (buysUsed >= 2) return false; const hasAnySequence = hasTriple || hasLadder; return hasAnySequence && cardValue >= 30;
                    case 6: if (buysUsed >= 1) return false; const hasBothTypes = hasTriple && hasLadder; return hasBothTypes && cardValue >= 35;
                    case 7: return cardValue >= 30;
                    default: return false;
                }
            }

            shouldRequestBuy(ai) {
                if (this.playerBuys[ai] === 0) return false;
                if (this.publishedSequences[ai].length > 0) return false;
                const humanPublished = this.publishedSequences[0].length > 0;
                if (humanPublished) return false;
                const othersPublishedWith3Plus = this.publishedSequences.some((seq, idx) => {
                    if (idx === ai) return false;
                    return seq.length > 0 && this.playerHands[idx].length >= 3;
                });
                if (othersPublishedWith3Plus && this.playerHands[ai].length >= 3) return true;
                return false;
            }

            setAIStatus(aiId, message) { const actionElement = document.getElementById(`${aiId}-action`); if (actionElement) actionElement.textContent = message }

            // ✅ FIX 3: Reduced buy window after publishing (5s instead of 10s)
            startBuyWindow(card, discardingPlayer) {
                if (!card) { console.log(`%c⚠️ Cannot open buy window - no card provided`, 'color: #ff6600; font-weight: bold;'); return }
                const buyWindowPlayer = (discardingPlayer + 2) % 3;
                if (this.buyWindow.active) this.closeBuyWindow();

                // 🎯 v2.5.0: Consistent 3-second buy window for faster game pace
                const duration = 3000;  // Always 3 seconds (removed conditional)
                console.log(`%c⏱️ v2.5.0: Buy window duration: ${duration / 1000}s`, 'color: #ffc107; font-weight: bold;');

                this.buyWindow.active = true;
                this.buyWindow.card = card;
                this.buyWindow.discardingPlayer = discardingPlayer;
                this.buyWindow.buyWindowPlayer = buyWindowPlayer;
                this.buyWindow.expiresAt = Date.now() + duration; // ✅ FIX 3: Variable duration

                const playerNames = ['Human', 'Habot', 'Jabot'];
                console.log(`%c🔔 Buy window opened for ${playerNames[buyWindowPlayer]} (${card.toString()}) - ${duration / 1000}s`, 'color: #ffc107; font-weight: bold;');
                if (buyWindowPlayer === 0) document.getElementById('buyBtn').disabled = false;
                this.updateBuyTimer();
            }


            checkAndOpenBuyWindowAfterDiscard(currentAI, statusId) {
                const aiName = currentAI === 1 ? 'Habot' : 'Jabot';

                // Check if we have a valid lastDiscard to create buy window for
                if (!this.lastDiscard || this.lastDiscardByPlayer === -1) {
                    console.log(`%c  ⏭️  No buy window: no valid lastDiscard`, 'color: #95a5a6;');
                    return false; // No buy window opened
                }

                const buyWindowPlayer = (this.lastDiscardByPlayer + 2) % 3;
                console.log(`%c  💡 Buy window check after ${aiName} discard`, 'color: #9b59b6; font-weight: bold;');
                console.log(`     lastDiscard: ${this.lastDiscard.toString()}`);
                console.log(`     lastDiscardByPlayer: ${this.lastDiscardByPlayer}`);
                console.log(`     buyWindowPlayer: ${buyWindowPlayer} (${['Human', 'Habot', 'Jabot'][buyWindowPlayer]})`);

                // Validate buy window conditions
                if (buyWindowPlayer === currentAI || buyWindowPlayer === this.lastDiscardByPlayer) {
                    console.log(`     ❌ Buy window blocked: invalid player configuration`);
                    return false;
                }

                console.log(`     ✅ Opening buy window!`);

                // Save next player info for after buy window closes
                const nextPlayer = (this.currentPlayer + 1) % this.players;
                this.buyWindow.pendingNextPlayer = nextPlayer;

                // Open the buy window
                this.startBuyWindow(this.lastDiscard, this.lastDiscardByPlayer);

                // Handle AI buy window if needed
                if (buyWindowPlayer > 0) {
                    this.handleAIBuyWindow(buyWindowPlayer);
                }

                // Clean up status after a delay
                if (statusId) {
                    setTimeout(() => { document.getElementById(`${statusId}-status`).classList.remove('active') }, 800);  // 🎯 v2.5.0: Faster (was 2000ms)
                }

                return true; // Buy window was opened
            }

            closeBuyWindow(reason = 'expired') {
                if (!this.buyWindow.active) return;

                const wasActive = this.buyWindow.active;
                const pendingDraw = this.buyWindow.pendingDeckDraw;
                const pendingNextPlayer = this.buyWindow.pendingNextPlayer; // ✅ NEW

                // Clear buy window state
                this.buyWindow.active = false;
                this.buyWindow.card = null;
                this.buyWindow.discardingPlayer = -1;
                this.buyWindow.buyWindowPlayer = -1;
                this.buyWindow.pendingDeckDraw = null;
                this.buyWindow.pendingNextPlayer = null; // ✅ NEW

                if (this.buyWindow.timerInterval) {
                    clearTimeout(this.buyWindow.timerInterval);
                    this.buyWindow.timerInterval = null;
                }

                document.getElementById('buyBtn').disabled = true;
                const timerEl = document.getElementById('buyTimer');
                if (timerEl) timerEl.style.display = 'none';

                // Log the closure reason
                if (reason === 'taken') {
                    showToast('Buy Denied - Card was taken', 'warning', 2000);
                } else if (reason === 'expired') {
                    console.log('%c⏱️ Buy window expired', 'color: #94a3b8;');
                } else if (reason === 'player-turn') {
                    console.log('%c🎮 Buy window closed - your turn', 'color: #4a90e2;');
                } else if (reason === 'player-took') {
                    console.log('%c✅ Buy window closed - you took the card', 'color: #28a745;');
                } else if (reason === 'bought') {
                    console.log('%c💰 Human bought card', 'color: #ffc107;');
                } else if (reason === 'ai-bought') {
                    console.log('%c💰 AI bought card', 'color: #ffc107;');
                }

                // Handle pendingDeckDraw (buy window opened during deck draw)
                if (pendingDraw && (reason === 'expired' || reason === 'bought')) {
                    const { ai, statusId } = pendingDraw;
                    const aiName = ai === 1 ? 'Habot' : 'Jabot';

                    console.log(`%c▶️ Resuming ${aiName}'s turn after buy window`, 'color: #4a90e2; font-weight: bold;');
                    setTimeout(() => {
                        // PATCH 1: Try auto-publish before drawing
                        const published = this.autoPublish(ai);
                        if (published) {
                            console.log(`✅ PATCH 1: ${aiName} auto-published sequences after buy window!`);
                        }
                        this.drawDeckCardForAI(ai, statusId);
                        this.continueAITurnAfterDraw(ai, statusId);
                    }, 500);

                } else if (pendingDraw && reason === 'ai-bought') {
                    const { ai, statusId } = pendingDraw;
                    const aiName = ai === 1 ? 'Habot' : 'Jabot';

                    console.log(`%c▶️ Resuming ${aiName}'s turn (AI bought, skipping duplicate draw)`, 'color: #4a90e2; font-weight: bold;');
                    setTimeout(() => {
                        // PATCH 1: Try auto-publish before continuing
                        const published = this.autoPublish(ai);
                        if (published) {
                            console.log(`✅ PATCH 1: ${aiName} auto-published after AI bought!`);
                        }
                        this.drawDeckCardForAI(ai, statusId);
                        this.continueAITurnAfterDraw(ai, statusId);
                    }, 500);

                }
                // ✅ NEW: Handle pendingNextPlayer (buy window opened after AI discarded from discard pile)
                else if (pendingNextPlayer !== null && pendingNextPlayer !== undefined) {
                    console.log(`%c▶️ Advancing to next player after buy window: Player ${pendingNextPlayer}`, 'color: #4a90e2; font-weight: bold;');
                    setTimeout(() => {
                        this.currentPlayer = pendingNextPlayer;
                        this.gamePhase = 'draw';
                        this.updateUI();
                        if (this.currentPlayer !== 0) {
                            this.aiTurn();
                        }
                    }, 500);

                }
            }

            updateBuyTimer() {
                if (!this.buyWindow.active) return;
                const remaining = Math.ceil((this.buyWindow.expiresAt - Date.now()) / 1000);
                if (remaining <= 0) { this.closeBuyWindow('expired'); return }
                const timerEl = document.getElementById('buyTimer');
                if (timerEl) {
                    timerEl.textContent = ` (${remaining}s)`;
                    timerEl.style.display = 'inline';
                    timerEl.style.color = remaining <= 2 ? '#ff6b35' : '#ffd700';
                }
                this.buyWindow.timerInterval = setTimeout(() => this.updateBuyTimer(), 100);
            }

            handleAIBuyWindow(aiPlayer) {
                const aiName = aiPlayer === 1 ? 'Habot' : 'Jabot';
                const card = this.buyWindow.card;

                // ✅ FIX 9: If buy window is for HUMAN, don't let AI handle it!
                if (this.buyWindow.buyWindowPlayer === 0) {
                    console.log(`%c🚫 FIX 9: Buy window is for HUMAN - AI should not interfere!`, 'color: #ff6b35; font-weight: bold;');
                    return;
                }

                if (!card) {
                    console.log(`%c⚠️ ${aiName} buy window has no card - closing`, 'color: #ff6600; font-weight: bold;');
                    this.closeBuyWindow('invalid');
                    if (this.buyWindow.pendingDeckDraw) {
                        const { ai, statusId } = this.buyWindow.pendingDeckDraw;
                        setTimeout(() => { this.drawDeckCardForAI(ai, statusId); this.continueAITurnAfterDraw(ai, statusId) }, 100);
                    }
                    return;
                }

                const statusId = aiPlayer === 1 ? 'habot' : 'jabot';
                document.getElementById(`${statusId}-status`).classList.add('active');
                this.setAIStatus(statusId, `Considering buy...`);
                setTimeout(() => {
                    const shouldBuy = this.shouldAllowBuy(aiPlayer, card);
                    if (shouldBuy && this.playerBuys[aiPlayer] > 0) {
                        const idx = this.discardPile.findIndex(c => c.id === card.id);
                        if (idx > -1) {
                            this.discardPile.splice(idx, 1);
                            this.playerHands[aiPlayer].push(card);
                            if (this.lastDiscard && this.lastDiscard.rank === card.rank && this.lastDiscard.suit === card.suit) {
                                this.lastDiscard = null;
                                this.lastDiscardByPlayer = -1;
                            }
                            if (this.deck.length === 0) this.reshuffleDeck();
                            if (this.deck.length > 0) {
                                const penalty = this.deck.pop();
                                this.playerHands[aiPlayer].push(penalty);
                            }
                            this.playerBuys[aiPlayer]--;
                            showBuyToast(aiName, card);
                            this.updateUI();
                        }
                    }
                    document.getElementById(`${statusId}-status`).classList.remove('active');
                    this.closeBuyWindow('ai-bought');
                }, 2500);
            }

            wouldDiscardImmediately(card, ai) {
                const tempHand = [...this.playerHands[ai], card];
                const rankCounts = {};
                tempHand.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });
                const protectedCards = new Set();
                Object.entries(rankCounts).forEach(([rank, count]) => {
                    if (count >= 2) { tempHand.forEach(c => { if (c.rank === rank) protectedCards.add(c.id) }) }
                });
                if (this.publishedSequences[ai].length > 0) {
                    if (this.couldExtendSequence(card, ai)) protectedCards.add(card.id);
                }
                const safeCards = tempHand.filter(c => !protectedCards.has(c.id));
                if (safeCards.length > 0) {
                    let worstValue = 9999;
                    let worstCard = null;
                    safeCards.forEach(c => {
                        const val = this.evaluateCard(c, ai);
                        if (val < worstValue) { worstValue = val; worstCard = c }
                    });
                    if (worstCard && worstCard.rank === card.rank && worstCard.suit === card.suit) return true;
                }
                return false;
            }

            aiTurn() {
                const ai = this.currentPlayer;
                const aiName = ai === 1 ? 'Habot' : 'Jabot';
                const statusId = ai === 1 ? 'habot' : 'jabot';

                console.log(`%c🤖 ${aiName} starting turn`, 'color: #3498db; font-weight: bold;');

                document.getElementById(`${statusId}-status`).classList.add('active');
                this.setAIStatus(statusId, 'Taking turn...');

                // 🎯 v2.5.0: Dynamic AI speed based on decision complexity
                const handSize = this.playerHands[ai].length;
                const hasPublished = this.publishedSequences[ai].length > 0;

                let delay = 0;
                if (!this.aiInstant) {
                    // Critical decisions = slower for realism
                    if (handSize <= 3 || (!hasPublished && this.canPublish(ai))) {
                        delay = 1000;  // Important moment - 1 second
                    }
                    // Routine play = faster
                    else {
                        delay = 500;  // Quick routine turn - 0.5 seconds
                    }
                }
                console.log(`%c  ⏱️  AI delay: ${delay}ms (${handSize} cards, ${hasPublished ? 'published' : 'not published'})`, 'color: #9e9e9e;');

                setTimeout(() => {
                    this.turnCounter++;
                    console.log(`%c  Turn ${this.turnCounter}`, 'color: #3498db;');

                    // PATCH 2: Check hand size - block buying if 13+ cards
                    const currentHandSize = this.playerHands[ai].length;
                    if (currentHandSize >= 13) {
                        console.log(`%c⛔ PATCH 2: ${aiName} has ${currentHandSize} cards - must reduce hand`, 'color: #e74c3c; font-weight: bold;');
                        // Force draw from deck instead of evaluating discard
                        console.log(`%c  ${aiName} drawing from deck (hand too large)...`, 'color: #3498db;');
                        this.setAIStatus(statusId, `Drawing from deck...`);
                        this.handleDeckDraw(ai, statusId);
                        return;
                    }

                    // PATCH 3: Try to auto-publish at turn start if hand is large
                    if (currentHandSize >= 12 && this.publishedSequences[ai].length === 0) {
                        console.log(`%c🚨 PATCH 3: ${aiName} has ${currentHandSize} cards and hasn't published - forcing publish check`, 'color: #e74c3c; font-weight: bold;');
                        const published = this.autoPublish(ai);
                        if (published) {
                            console.log(`%c✅ PATCH 3: ${aiName} emergency published!`, 'color: #27ae60; font-weight: bold;');
                            // Update hand size after publishing
                            const newHandSize = this.playerHands[ai].length;
                            console.log(`%c   Hand size reduced from ${currentHandSize} to ${newHandSize}`, 'color: #27ae60;');
                        }
                    }

                    let discardCard = null;
                    let discardScore = 0;
                    if (this.discardPile.length > 0) {
                        discardCard = this.discardPile[this.discardPile.length - 1];
                        discardScore = this.evaluateCard(discardCard, ai);
                        if (this.lastAIDiscard[ai] && this.lastAIDiscard[ai].rank === discardCard.rank && this.lastAIDiscard[ai].suit === discardCard.suit) {
                            discardScore = -999;
                        }
                    }

                    //Nash: Changed threshold from 15 to  11 to make the game faster
                    let threshold = 11;
                    if (this.publishedSequences[ai].length === 0) {
                        const seqs = this.findSequences(this.playerHands[ai]);
                        const req = this.handReqs[this.currentHand].seqs;
                        const needTriples = req.filter(s => s === 'triple').length;
                        const needLadders = req.filter(s => s === 'ladder').length;
                        const hasTriples = seqs.triples.length;
                        const hasLadders = seqs.ladders.length;
                        if (hasTriples >= needTriples - 1 || hasLadders >= needLadders - 1) threshold = 10;
                    }
                    const personality = this.getAIPersonality(ai);
                    if (personality === 'rabbit') threshold -= 2;
                    else if (personality === 'tortoise') threshold += 2;
                    const forceBuy = discardCard && this.shouldAllowBuy(ai, discardCard);
                    let shouldTake = forceBuy || (discardCard && discardScore >= threshold);

                    // 🎯 PATCH M: In triple games, only buy if completes a triple
                    if (shouldTake && this.discardPile.length > 0) {
                        const req = this.handReqs[this.currentHand].seqs;
                        const hasOnlyTriples = req.every(s => s === 'triple');

                        if (hasOnlyTriples && !forceBuy) {
                            const topCard = this.discardPile[this.discardPile.length - 1];
                            const matchingRank = this.playerHands[ai].filter(c => c.rank === topCard.rank).length;

                            if (matchingRank < 2) {
                                // This card won't complete a triple (need 2 existing + 1 buy = 3)
                                console.log(`  → PATCH M: Blocking buy - ${topCard.toString()} won't complete triple (only ${matchingRank} in hand)`);
                                shouldTake = false;
                            } else {
                                console.log(`  → PATCH M: Allowing buy - ${topCard.toString()} COMPLETES triple!`);
                            }
                        }
                    }

                    // 🎯 PATCH H: Block buying in endgame
                    const aiHandSize = this.playerHands[ai].length;  // ← Changed name
                    const anyPlayerNearWin = this.playerHands.some((h, idx) => h.length <= 3 && this.publishedSequences[idx].length > 0);

                    if (shouldTake && aiHandSize <= 3 && this.publishedSequences[ai].length > 0) {
                        console.log(`%c  🛑 PATCH H: Blocking buy - AI has ${aiHandSize} cards in endgame`, 'color: #e74c3c; font-weight: bold;');
                        shouldTake = false;
                    }

                    if (shouldTake && anyPlayerNearWin) {
                        console.log(`%c  🛑 PATCH H: Blocking buy - Someone near win (≤3 cards + published)`, 'color: #e74c3c; font-weight: bold;');
                        shouldTake = false;
                    }

                    console.log(`%c  🎯 ${aiName} evaluation:`, 'color: #e67e22; font-weight: bold;');
                    console.log(`     discardCard: ${discardCard ? discardCard.toString() : 'none'}`);
                    console.log(`     discardScore: ${discardScore}`);
                    console.log(`     threshold: ${threshold}`);
                    console.log(`     forceBuy: ${forceBuy}`);
                    console.log(`     shouldTake: ${shouldTake} ${!shouldTake && (aiHandSize <= 3 || anyPlayerNearWin) ? '(BLOCKED - endgame)' : ''}`);

                    // 🎯 PATCH I: Block buying after publishing all required sequences in triple games
                    if (shouldTake && this.publishedSequences[ai].length > 0) {
                        const req = this.handReqs[this.currentHand].seqs;
                        const needTriples = req.filter(s => s === 'triple').length;
                        const needLadders = req.filter(s => s === 'ladder').length;

                        // Count what AI has published
                        const publishedCards = this.publishedSequences[ai].flat();
                        const hasPublishedEnough = publishedCards.length >= (needTriples * 3 + needLadders * 4);

                        if (hasPublishedEnough && needLadders === 0) {
                            // Triple-only game and AI has published all requirements
                            console.log(`%c  🛑 PATCH I: Blocking buy - Already published all triples`, 'color: #ff9800; font-weight: bold;');
                            shouldTake = false;
                        }
                    }

                    if (shouldTake && this.discardPile.length > 0) {

                        if (this.wouldDiscardImmediately(this.discardPile[this.discardPile.length - 1], ai)) {
                            this.setAIStatus(statusId, `Evaluating options...`);
                            this.handleDeckDraw(ai, statusId);
                            return;
                        } else {
                            const drawnCard = this.discardPile.pop();
                            this.playerHands[ai].push(drawnCard);

                            // ✅ FIX 2: Show specific toast when AI takes card during buy window
                            if (this.buyWindow.active && this.buyWindow.buyWindowPlayer === 0 && this.buyWindow.card && this.buyWindow.card.id === drawnCard.id) {
                                console.log(`%c🚨 FIX 2: AI took card during human buy window`, 'color: #ff6b35; font-weight: bold;');
                                showAITookCardToast(aiName, drawnCard);
                            }

                            if (this.buyWindow.active && this.buyWindow.card && this.buyWindow.card.id === drawnCard.id) {
                                this.closeBuyWindow('taken');
                            }
                            if (this.lastDiscard && this.lastDiscard.rank === drawnCard.rank && this.lastDiscard.suit === drawnCard.suit) {
                                this.lastDiscard = null;
                                this.lastDiscardByPlayer = -1;
                            }
                            if (forceBuy) this.setAIStatus(statusId, `Analyzing hand...`);
                            else this.setAIStatus(statusId, `Drawing card...`);
                        }

                    } else {

                        console.log(`%c  🎯 ${aiName} evaluation:`, 'color: #e67e22; font-weight: bold;');
                        console.log(`     discardCard: ${discardCard ? discardCard.toString() : 'none'}`);
                        console.log(`     discardScore: ${discardScore}`);
                        console.log(`     threshold: ${threshold}`);
                        console.log(`     forceBuy: ${forceBuy}`);
                        console.log(`     shouldTake: ${shouldTake}`);

                        console.log(`%c  ${aiName} drawing from deck...`, 'color: #3498db;');
                        this.setAIStatus(statusId, `Drawing from deck...`);
                        this.handleDeckDraw(ai, statusId);
                        return;
                    }

                    this.continueAITurnAfterDraw(ai, statusId);
                }, 1500);
            }

            handleDeckDraw(ai, statusId) {
                const aiName = ai === 1 ? 'Habot' : 'Jabot';

                console.log(`%c🔍 handleDeckDraw called for ${aiName}`, 'color: #9b59b6; font-weight: bold;');
                console.log(`  lastDiscard: ${this.lastDiscard ? this.lastDiscard.toString() : 'null'}`);
                console.log(`  lastDiscardByPlayer: ${this.lastDiscardByPlayer}`);

                if (this.lastDiscard && this.lastDiscardByPlayer !== -1) {
                    const buyWindowPlayer = (this.lastDiscardByPlayer + 2) % 3;
                    console.log(`  buyWindowPlayer would be: ${buyWindowPlayer} (${['Human', 'Habot', 'Jabot'][buyWindowPlayer]})`);

                    if (buyWindowPlayer !== ai && buyWindowPlayer !== this.lastDiscardByPlayer) {
                        console.log(`  ✅ Buy window conditions met!`);
                        const cardStillExists = this.discardPile.some(c => c.rank === this.lastDiscard.rank && c.suit === this.lastDiscard.suit);

                        if (!cardStillExists) {
                            this.lastDiscard = null;
                            this.lastDiscardByPlayer = -1;
                            this.drawDeckCardForAI(ai, statusId);
                            this.continueAITurnAfterDraw(ai, statusId);
                            return;
                        }
                        this.startBuyWindow(this.lastDiscard, this.lastDiscardByPlayer);
                        this.buyWindow.pendingDeckDraw = { ai, statusId };
                        if (buyWindowPlayer > 0) this.handleAIBuyWindow(buyWindowPlayer);
                        return;
                    }
                }
                this.drawDeckCardForAI(ai, statusId);
                this.continueAITurnAfterDraw(ai, statusId);
            }

            drawDeckCardForAI(ai, statusId) {
                if (this.deck.length === 0) { this.reshuffleDeck(); this.updateUI() }
                if (this.deck.length > 0) {
                    const drawnCard = this.deck.pop();
                    this.playerHands[ai].push(drawnCard);
                    this.setAIStatus(statusId, `Analyzed hand`);
                }
            }

            continueAITurnAfterDraw(ai, statusId) {
                const aiName = ai === 1 ? 'Habot' : 'Jabot';
                // PATCH 4: Emergency publish if hand is too large
                const currentHandSize = this.playerHands[ai].length;
                if (currentHandSize >= 13 && this.publishedSequences[ai].length === 0 && this.canPublish(ai)) {
                    console.log(`%c🚨 PATCH 4: ${aiName} has ${currentHandSize} cards - FORCING publish!`, 'color: #e74c3c; font-weight: bold;');
                    const publishSuccess = this.autoPublish(ai);
                    if (publishSuccess) {
                        this.aiJustPublished[ai] = true;
                        this.setAIStatus(statusId, `Emergency Published!`);
                        console.log(`%c✅ PATCH 4: ${aiName} emergency publish SUCCESS!`, 'color: #27ae60; font-weight: bold;');
                        const newHandSize = this.playerHands[ai].length;
                        console.log(`%c   Hand reduced from ${currentHandSize} to ${newHandSize}`, 'color: #27ae60;');
                    } else {
                        console.log(`%c⚠️ PATCH 4: ${aiName} emergency publish FAILED - no valid sequences`, 'color: #f39c12; font-weight: bold;');
                    }
                }

                // 🎯 PATCH L2: Auto-drop excess pairs in triple games
                const req = this.handReqs[this.currentHand].seqs;
                const hasOnlyTriples = req.every(s => s === 'triple');

                if (hasOnlyTriples) {
                    // Count pairs
                    const rankCounts = {};
                    this.playerHands[ai].forEach(c => {
                        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
                    });

                    const pairs = Object.entries(rankCounts).filter(([rank, count]) => count === 2);

                    if (pairs.length > 4) {
                        console.log(`%c  → PATCH L2: ${aiName} has ${pairs.length} pairs - dropping worst one`, 'color: #e67e22; font-weight: bold;');

                        // Find highest-value pair to drop
                        let worstPairRank = null;
                        let highestValue = -1;

                        pairs.forEach(([rank, count]) => {
                            const cardValue = this.playerHands[ai].find(c => c.rank === rank).getValue();
                            if (cardValue > highestValue) {
                                highestValue = cardValue;
                                worstPairRank = rank;
                            }
                        });

                        // Drop one card from worst pair
                        const cardToDrop = this.playerHands[ai].find(c => c.rank === worstPairRank);
                        const dropIndex = this.playerHands[ai].indexOf(cardToDrop);
                        this.playerHands[ai].splice(dropIndex, 1);
                        this.discardPile.push(cardToDrop);

                        console.log(`%c  → PATCH L2: Auto-dropped ${cardToDrop.toString()} (highest-value pair)`, 'color: #e67e22; font-weight: bold;');
                        this.updateUI();

                        // End turn - we already discarded
                        this.setAIStatus(statusId, '');
                        document.getElementById(`${statusId}-status`).classList.remove('active');
                        this.nextPlayer();
                        return;
                    }
                }

                const canPublishNow = this.canPublish(ai) && this.publishedSequences[ai].length === 0;

                if (canPublishNow) {
                    let shouldPublish = false;
                    const opponentDanger = this.publishedSequences.some((seq, idx) => idx !== ai && seq.length > 0 && this.playerHands[idx].length <= 3);
                    if (opponentDanger) shouldPublish = true;
                    const personality = this.getAIPersonality(ai);

                    //Nash: changed it from 22 : 30 to make the game faster
                    const turnLimit = personality === 'rabbit' ? 15 : 20;
                    if (this.turnCounter >= turnLimit) shouldPublish = true;
                    else {
                        let optimalSize = this.currentHand <= 3 ? 7 : 6;
                        if (personality === 'rabbit') optimalSize += 1;
                        else if (personality === 'tortoise') optimalSize -= 1;
                        if (this.playerHands[ai].length <= optimalSize) shouldPublish = true;
                    }

                    console.log(`%c  📋 ${aiName} publish check:`, 'color: #9b59b6; font-weight: bold;');
                    console.log(`     canPublishNow: ${canPublishNow}`);
                    console.log(`     opponentDanger: ${opponentDanger}`);
                    console.log(`     turnCounter: ${this.turnCounter}`);
                    console.log(`     handSize: ${this.playerHands[ai].length}`);
                    console.log(`     shouldPublish: ${shouldPublish}`);

                    if (shouldPublish) {
                        console.log(`%c  🎉 ${aiName} attempting to publish!`, 'color: #28a745; font-weight: bold;');
                        const publishSuccess = this.autoPublish(ai);
                        console.log(`     publishSuccess: ${publishSuccess}`);

                        if (publishSuccess) {
                            this.aiJustPublished[ai] = true;
                            this.setAIStatus(statusId, `Published!`);
                            console.log(`%c  ✅ ${aiName} PUBLISHED successfully!`, 'color: #28a745; font-weight: bold;');
                            console.log(`     Published sequences:`, this.publishedSequences[ai]);
                        } else {
                            console.log(`%c  ❌ ${aiName} publish FAILED`, 'color: #dc3545; font-weight: bold;');
                        }
                        if (this.playerHands[ai].length === 0) {
                            console.log(`%c  🏆 ${aiName} has NO cards left - WINS!`, 'color: #ffc107; font-weight: bold;');
                            this.endHand(ai);
                            return;
                        }
                    }
                }

                // PATCH 5: Try to publish again if still holding 12+ cards after first publish
                if (this.playerHands[ai].length >= 12 && this.publishedSequences[ai].length > 0 && this.canPublish(ai)) {
                    console.log(`%c🚨 PATCH 5: ${aiName} still has ${this.playerHands[ai].length} cards after publishing - checking for more sequences`, 'color: #e74c3c; font-weight: bold;');
                    const additionalPublish = this.autoPublish(ai);
                    if (additionalPublish) {
                        console.log(`%c✅ PATCH 5: ${aiName} published additional sequences!`, 'color: #27ae60; font-weight: bold;');
                    }
                }

                if (!this.aiJustPublished[ai] && this.playerHands[ai].length > 0 && this.publishedSequences[ai].length > 0) {
                    const addResult = this.tryAddToPublished(ai);

                    if (addResult === 'win') {
                        this.setAIStatus(statusId, `Added and WINS!`);
                        this.updateUI();
                        setTimeout(() => { this.endHand(ai) }, 50);
                        return;
                    } else if (addResult === true) {
                        const current = document.getElementById(`${statusId}-action`).textContent;
                        this.setAIStatus(statusId, current + ' → Added card');
                    }
                }
                if (this.playerHands[ai].length === 0) {
                    this.setAIStatus(statusId, `WINS!`);
                    this.updateUI();
                    setTimeout(() => { this.endHand(ai) }, 1500);
                    return;
                }
                if (this.playerHands[ai].length > 0) {
                    const worst = this.findWorstCard(ai);
                    const idx = this.playerHands[ai].findIndex(c => c.id === worst.id);
                    if (idx > -1) {
                        this.playerHands[ai].splice(idx, 1);
                        this.discardPile.push(worst);
                        this.lastAIDiscard[ai] = worst;
                        this.lastDiscard = worst;
                        this.lastDiscardByPlayer = ai;
                        const current = document.getElementById(`${statusId}-action`).textContent;
                        this.setAIStatus(statusId, current + ` → Discarded: ${worst.toString()}`);
                    }
                }
                if (this.playerHands[ai].length === 0) {
                    this.setAIStatus(statusId, `WINS!`);
                    this.updateUI();
                    setTimeout(() => { this.endHand(ai) }, 50);
                    return;
                }
                if (this.shouldRequestBuy(ai)) {
                    const current = document.getElementById(`${statusId}-action`).textContent;
                    if (!current.includes('BUY!')) this.setAIStatus(statusId, current + ' → Says "BUY!"');
                }

                this.lastDiscard = this.discardPile[this.discardPile.length - 1];
                this.lastDiscardByPlayer = ai;
                this.aiJustPublished[ai] = false;

                // ✅ Check if buy window should open after AI discarded
                const buyWindowOpened = this.checkAndOpenBuyWindowAfterDiscard(ai, statusId);

                if (buyWindowOpened) {
                    // Buy window is open - it will handle game continuation
                    return;
                }

                // No buy window - continue normally
                setTimeout(() => { document.getElementById(`${statusId}-status`).classList.remove('active') }, 2000);
                this.currentPlayer = (this.currentPlayer + 1) % this.players;
                this.gamePhase = 'draw';
                this.updateUI();
                if (this.currentPlayer !== 0) this.aiTurn();
            }

            tryAddToPublished(aiIdx) {
                const req = this.handReqs[this.currentHand].seqs;
                const hasTriples = req.some(s => s === 'triple');
                const hasLadders = req.some(s => s === 'ladder');
                const playerOrder = [aiIdx];
                for (let p = 0; p < this.players; p++) {
                    if (p !== aiIdx) playerOrder.push(p);
                }
                for (let p of playerOrder) {
                    if (this.publishedSequences[p].length === 0) continue;
                    if (p !== aiIdx && this.playerHands[p].length <= 4) continue;
                    for (let i = 0; i < this.playerHands[aiIdx].length; i++) {
                        const card = this.playerHands[aiIdx][i];
                        const published = this.publishedSequences[p];
                        const inOwnSequences = this.publishedSequences[aiIdx].find(c => c.rank === card.rank && c.suit === card.suit);
                        if (inOwnSequences) continue;
                        const alreadyPublished = published.find(c => c.id === card.id);
                        if (alreadyPublished) continue;
                        const sameRankSuit = published.filter(c => c.rank === card.rank && c.suit === card.suit);
                        if (sameRankSuit.length >= 2) continue;
                        if (hasTriples) {
                            const rankCounts = {};
                            published.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });
                            if (rankCounts[card.rank] >= 3) {
                                this.playerHands[aiIdx].splice(i, 1);
                                this.publishedSequences[p].push(card);
                                const allPublished = this.publishedSequences[p];
                                const tripleCards = [];
                                const ladderCards = [];
                                const processedRanks = new Set();
                                allPublished.forEach(c => {
                                    const count = allPublished.filter(pc => pc.rank === c.rank).length;
                                    if (count >= 3 && !processedRanks.has(c.rank)) {
                                        const sameRank = allPublished.filter(card => card.rank === c.rank);
                                        tripleCards.push(...sameRank);
                                        processedRanks.add(c.rank);
                                    }
                                });
                                allPublished.forEach(c => {
                                    if (!tripleCards.find(tc => tc.id === c.id)) ladderCards.push(c);
                                });
                                tripleCards.sort((a, b) => a.getValue() - b.getValue());
                                ladderCards.sort((a, b) => {
                                    const suitOrder = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
                                    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
                                    return a.getValue() - b.getValue();
                                });
                                this.publishedSequences[p] = [...tripleCards, ...ladderCards];
                                if (this.playerHands[aiIdx].length === 0) { this.endHand(aiIdx); return 'win' }
                                return true;
                            }
                        }
                        if (hasLadders) {
                            const sameSuit = published.filter(c => c.suit === card.suit);
                            if (sameSuit.length >= 4) {
                                const cardVal = card.getValue();
                                const values = sameSuit.map(c => c.getValue()).sort((a, b) => a - b);
                                const ladders = []; let remainingValues = [...values];
                                const hasAce = values.includes(1); const hasJack = values.includes(11);
                                const hasQueen = values.includes(12); const hasKing = values.includes(13);
                                if (hasAce && hasJack && hasQueen && hasKing) {
                                    ladders.push([1, 11, 12, 13]);
                                    remainingValues = remainingValues.filter(v => ![1, 11, 12, 13].includes(v));
                                }
                                if (remainingValues.length >= 4) {
                                    let currentLadder = [remainingValues[0]];
                                    for (let i = 1; i < remainingValues.length; i++) {
                                        if (remainingValues[i] === currentLadder[currentLadder.length - 1] + 1) {
                                            currentLadder.push(remainingValues[i]);
                                        } else {
                                            if (currentLadder.length >= 4) { ladders.push([...currentLadder]) }
                                            currentLadder = [remainingValues[i]];
                                        }
                                    }
                                    if (currentLadder.length >= 4) { ladders.push(currentLadder) }
                                }
                                const canExtendLadder = ladders.some(ladder => {
                                    return this.canCardExtendLadder(cardVal, ladder);
                                });
                                if (canExtendLadder) {
                                    this.playerHands[aiIdx].splice(i, 1);
                                    this.publishedSequences[p].push(card);
                                    const allPublished = this.publishedSequences[p];
                                    const rankCounts = {};
                                    allPublished.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });
                                    const tripleCards = [];
                                    const ladderCards = [];
                                    const processedRanks = new Set();
                                    allPublished.forEach(c => {
                                        if (rankCounts[c.rank] >= 3 && !processedRanks.has(c.rank)) {
                                            const sameRank = allPublished.filter(card => card.rank === c.rank);
                                            tripleCards.push(...sameRank);
                                            processedRanks.add(c.rank);
                                        }
                                    });
                                    allPublished.forEach(c => {
                                        if (!tripleCards.find(tc => tc.id === c.id)) ladderCards.push(c);
                                    });
                                    tripleCards.sort((a, b) => a.getValue() - b.getValue());
                                    ladderCards.sort((a, b) => {
                                        const suitOrder = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
                                        if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
                                        return a.getValue() - b.getValue();
                                    });
                                    this.publishedSequences[p] = [...tripleCards, ...ladderCards];
                                    if (this.playerHands[aiIdx].length === 0) { this.endHand(aiIdx); return 'win' }
                                    return true;
                                }
                            }
                        }
                    }
                }
                return false;
            }

            endHand(winner) {
                const winnerName = winner === 0 ? 'You' : winner === 1 ? 'Habot' : 'Jabot';
                showWinToast(winnerName);
                for (let i = 0; i < this.players; i++) {
                    if (i === winner) continue;
                    let score = 0;
                    this.playerHands[i].forEach(c => score += c.getPenaltyValue());
                    this.playerScores[i] += score;
                }
                setTimeout(() => { this.showModal('Hand Complete', `${winnerName} won Hand ${this.currentHand}!`) }, 2000);
                setTimeout(() => {
                    this.currentHand++;
                    if (this.currentHand > 7) this.showFinalResults();
                    else {
                        this.playerBuys = this.currentHand === 7 ? [2, 2, 2] : [3, 3, 3];
                        this.publishedSequences = [[], [], []]; this.playerHands = [[], [], []]; this.selectedCards = [];
                        this.gamePhase = 'draw'; this.currentPlayer = 0; this.justPublished = false; this.aiJustPublished = [false, false, false];
                        this.lastDiscard = null; this.lastDiscardByPlayer = -1; this.discardPile = [];
                        this.turnCounter = 0; this.lastAIDiscard = [null, null, null]; this.lastCardWarningShown = null;
                        this.initDeck(); this.deal(); this.updateUI();
                    }
                }, 4000);
            }

            showFinalResults() {
                const results = this.playerScores.map((s, i) => ({ name: i === 0 ? 'You' : i === 1 ? 'Habot' : 'Jabot', score: s })).sort((a, b) => a.score - b.score);
                const winner = results[0];
                const loser = results[results.length - 1];
                persistentScores = [...this.playerScores];
                const msg = `Game Complete!\n\n🏆 ${winner.name} wins with ${winner.score} points!\n🎃 ${loser.name} is the Habib Punja with ${loser.score} points!`;
                this.showModal('Final Results', msg);

                setTimeout(async () => {
                    console.log('%c🎮 Starting New Game...', 'color: #2196f3; font-weight: bold; font-size: 16px;');

                    // Create game instance
                    game = new GameState(true);

                    // Draw for starting player
                    const startingPlayer = await game.drawForFirstTurn();
                    game.currentPlayer = startingPlayer;
                    game.startingPlayer = startingPlayer;

                    console.log(`%c🎯 Starting player set: ${['You', 'Habot', 'Jabot'][startingPlayer]}`, 'color: #e91e63; font-weight: bold;');

                    // Initialize game
                    game.initDeck();
                    game.deal();
                    game.updateUI();

                    // If AI starts, begin their turn
                    if (game.currentPlayer !== 0) {
                        game.aiTurn();
                    }

                    console.log('%c✅ Game initialized!', 'color: #4caf50; font-weight: bold;');
                }, 5000);

            }

            showModal(title, msg) {
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
                modal.innerHTML = `<div style="background:#1a4d2e;padding:30px;border-radius:15px;text-align:center;border:2px solid #ffd700;">
                                        <h2 style="color:#ffd700;margin-bottom:15px;">${title}</h2>
                                        <p style="color:white;margin-bottom:20px;white-space:pre-line;">${msg}</p>
                                        <button onclick="this.closest('div').parentElement.remove();" style="padding:12px 30px;background:#28a745;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">OK</button>
                                    </div>`;
                document.body.appendChild(modal);
            }

            showDisambiguationModal(card, playerIdx, cardIdx) {
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;';
                modal.innerHTML = `
                                <div style="background:#1a4d2e;padding:30px;border-radius:15px;text-align:center;border:2px solid #ffd700;max-width:500px;">
                                    <h2 style="color:#ffd700;margin-bottom:15px;">🎯 Choose Sequence</h2>
                                    <p style="color:white;margin-bottom:20px;">
                                        ${card.toString()} can extend BOTH your triple and your ladder.<br><br>
                                        Which sequence do you want to add it to?
                                    </p>
                                    <div style="display:flex;gap:15px;justify-content:center;">
                                        <button id="chooseTriple" style="padding:12px 24px;background:#e74c3c;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1rem;">
                                            Add to Triple
                                        </button>
                                        <button id="chooseLadder" style="padding:12px 24px;background:#3498db;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:1rem;">
                                            Add to Ladder
                                        </button>
                                    </div>
                                    <button id="cancelChoice" style="margin-top:15px;padding:8px 20px;background:#6b7280;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">
                                        Cancel
                                    </button>
                                </div>
                                    `;
                document.body.appendChild(modal);
                document.getElementById('chooseTriple').onclick = () => {
                    console.log(`%c✅ FIX 6: User chose TRIPLE for ${card.toString()}`, 'color:#28a745;font-weight:bold');
                    modal.remove();
                    this.executeAddToPublished(card, playerIdx, cardIdx, 'triple');
                };
                document.getElementById('chooseLadder').onclick = () => {
                    console.log(`%c✅ FIX 6: User chose LADDER for ${card.toString()}`, 'color:#28a745;font-weight:bold');
                    modal.remove();
                    this.executeAddToPublished(card, playerIdx, cardIdx, 'ladder');
                };
                document.getElementById('cancelChoice').onclick = () => {
                    console.log(`%c❌ FIX 6: User cancelled`, 'color:#94a3b8');
                    modal.remove();
                };
            }

            executeAddToPublished(card, playerIdx, cardIdx, forceType) {
                const req = this.handReqs[this.currentHand].seqs;
                const hasTriples = req.some(s => s === 'triple');
                const hasLadders = req.some(s => s === 'ladder');
                const published = this.publishedSequences[playerIdx];

                if (forceType === 'triple' && hasTriples) {
                    console.log(`%c  ✅ FIX 6: Adding ${card.toString()} to TRIPLE`, 'color:#28a745;font-weight:bold');
                    this.playerHands[0].splice(cardIdx, 1);
                    this.publishedSequences[playerIdx].push(card);
                    const allPublished = this.publishedSequences[playerIdx];
                    const tripleCards = [];
                    const ladderCards = [];
                    const processedRanks = new Set();
                    allPublished.forEach(c => {
                        const count = allPublished.filter(pc => pc.rank === c.rank).length;
                        if (count >= 3 && !processedRanks.has(c.rank)) {
                            const sameRank = allPublished.filter(card => card.rank === c.rank);
                            tripleCards.push(...sameRank);
                            processedRanks.add(c.rank);
                        }
                    });
                    allPublished.forEach(c => {
                        if (!tripleCards.find(tc => tc.id === c.id)) ladderCards.push(c);
                    });
                    tripleCards.sort((a, b) => a.getValue() - b.getValue());
                    ladderCards.sort((a, b) => {
                        const suitOrder = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
                        if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
                        return a.getValue() - b.getValue();
                    });
                    this.publishedSequences[playerIdx] = [...tripleCards, ...ladderCards];
                } else if (forceType === 'ladder' && hasLadders) {
                    console.log(`%c  ✅ FIX 6: Adding ${card.toString()} to LADDER`, 'color:#28a745;font-weight:bold');
                    this.playerHands[0].splice(cardIdx, 1);
                    this.publishedSequences[playerIdx].push(card);
                    const allPublished = this.publishedSequences[playerIdx];
                    const rankCounts = {};
                    allPublished.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });
                    const tripleCards = [];
                    const ladderCards = [];
                    const processedRanks = new Set();
                    allPublished.forEach(c => {
                        if (rankCounts[c.rank] >= 3 && !processedRanks.has(c.rank)) {
                            const sameRank = allPublished.filter(card => card.rank === c.rank);
                            tripleCards.push(...sameRank);
                            processedRanks.add(c.rank);
                        }
                    });
                    allPublished.forEach(c => {
                        if (!tripleCards.find(tc => tc.id === c.id)) ladderCards.push(c);
                    });
                    tripleCards.sort((a, b) => a.getValue() - b.getValue());
                    ladderCards.sort((a, b) => {
                        const suitOrder = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
                        if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
                        return a.getValue() - b.getValue();
                    });
                    this.publishedSequences[playerIdx] = [...tripleCards, ...ladderCards];
                }

                this.selectedCards = [];
                if (this.playerHands[0].length === 0) { this.endHand(0); return }
                this.updateUI();
            }


            // ============================================
            // VERIFICATION COMMANDS (for cross-version testing)
            // ============================================

            jumpToHand(handNum) {
                if (handNum < 1 || handNum > 7) {
                    console.log('⚠️ Hand must be 1-7');
                    return;
                }
                console.log(`🔧 Jumping to Hand ${handNum}...`);
                this.currentHand = handNum;
                this.playerBuys = handNum === 7 ? [2, 2, 2] : [3, 3, 3];
                this.publishedSequences = [[], [], []];
                this.playerHands = [[], [], []];
                this.selectedCards = [];
                this.gamePhase = 'draw';
                this.currentPlayer = 0;
                this.justPublished = false;
                this.aiJustPublished = [false, false, false];
                this.lastDiscard = null;
                this.lastDiscardByPlayer = -1;
                this.discardPile = [];
                this.turnCounter = 0;
                this.lastAIDiscard = [null, null, null];
                this.lastCardWarningShown = null;
                this.buyWindow = { active: false, card: null, discardingPlayer: -1, buyWindowPlayer: -1, expiresAt: 0, timerInterval: null, pendingDeckDraw: null };
                this.initDeck();
                this.deal();
                this.updateUI();
                console.log(`✅ Hand ${handNum} started`);
            }

            resetScores() {
                console.log('🔧 Resetting all scores to 0...');
                persistentScores = [0, 0, 0];
                this.playerScores = [0, 0, 0];
                this.updateUI();
                console.log('✅ Scores reset');
            }

            showState() {
                console.log('📊 GAME STATE:');
                console.log(`  Hand: ${this.currentHand}/7`);
                console.log(`  Phase: ${this.gamePhase}`);
                console.log(`  Current Player: ${this.currentPlayer} (${['You', 'Habot', 'Jabot'][this.currentPlayer]})`);
                console.log(`  Scores: [${this.playerScores.join(', ')}]`);
                console.log(`  Buys: [${this.playerBuys.join(', ')}]`);
                console.log(`  Cards in hand: [${this.playerHands.map(h => h.length).join(', ')}]`);
                console.log(`  Published sequences: [${this.publishedSequences.map(p => p.length).join(', ')}]`);
                console.log(`  Deck: ${this.deck.length} cards`);
                console.log(`  Discard: ${this.discardPile.length} cards`);
            }

            verifySync() {
                const state = {
                    hand: this.currentHand,
                    phase: this.gamePhase,
                    player: this.currentPlayer,
                    scores: this.playerScores,
                    buys: this.playerBuys,
                    handSizes: this.playerHands.map(h => h.length),
                    published: this.publishedSequences.map(p => p.length),
                    deckSize: this.deck.length,
                    discardSize: this.discardPile.length
                };
                console.log('🔍 SYNC CHECK:', JSON.stringify(state, null, 2));
                return state;
            }

            updateUI() {
                const req = this.handReqs[this.currentHand];
                document.getElementById('currentHand').textContent = this.currentHand;
                document.getElementById('handRequirements').textContent = req.name;
                const progress = this.getPublishProgress();
                let progressParts = [];
                if (progress.needTriples > 0) progressParts.push(`${progress.hasTriples}/${progress.needTriples} triples`);
                if (progress.needLadders > 0) progressParts.push(`${progress.hasLadders}/${progress.needLadders} ladders`);
                const progressText = `${req.name} - You have: ${progressParts.join(', ')}`;
                document.getElementById('detailedRequirements').textContent = progressText;
                const reqEl = document.getElementById('detailedRequirements');
                reqEl.style.color = progress.canPublish ? '#28a745' : '#ffed4e';
                if (progress.canPublish) reqEl.classList.add('ready');
                else reqEl.classList.remove('ready');
                const turnText = this.currentPlayer === 0 ? 'Your Turn' : this.currentPlayer === 1 ? "Habot's Turn" : "Jabot's Turn";
                document.getElementById('turnIndicator').innerHTML = `${turnText} <span style="opacity:0.7;font-size:0.9em;">(Turn ${this.turnCounter})</span>`;
                document.getElementById('playerBuys').textContent = this.playerBuys[0];
                document.getElementById('player2Buys').textContent = this.playerBuys[1];
                document.getElementById('player3Buys').textContent = this.playerBuys[2];
                this.updateLeaderboard();
                const selInfo = document.getElementById('selectionInfo');
                const selCount = document.getElementById('selectedCount');
                if (this.selectedCards.length > 0) { selInfo.style.display = 'inline-block'; selCount.textContent = this.selectedCards.length }
                else selInfo.style.display = 'none';
                const playerHasPublished = this.publishedSequences[0].length > 0;
                const addSection = document.getElementById('addToPublishedSection');
                if (playerHasPublished && this.currentPlayer === 0 && this.gamePhase === 'discard' && this.selectedCards.length === 1 && !this.justPublished && this.playerHands[0].length > 1) addSection.style.display = 'block';
                else addSection.style.display = 'none';
                this.renderHand(); this.renderAIHands(); this.renderPublished();
                if (this.discardPile.length > 0) document.getElementById('topDiscard').textContent = this.discardPile[this.discardPile.length - 1].toString();
                document.getElementById('discardBtn').disabled = this.currentPlayer !== 0 || this.gamePhase !== 'discard' || this.selectedCards.length !== 1;

                // 🎯 PATCH J: Only enable publish if can actually publish OR extend sequences
                const canPublishNew = this.canPublish(0);
                const canExtendExisting = this.publishedSequences[0].length > 0 &&
                    this.playerHands[0].some(card =>
                        this.publishedSequences[0].some(seq => this.canAddToPublishedSequence(card, seq))
                    );

                document.getElementById('publishBtn').disabled = this.currentPlayer !== 0 ||
                    this.gamePhase !== 'discard' ||
                    (!canPublishNew && !canExtendExisting);

                document.getElementById('buyBtn').disabled = !this.buyWindow.active || this.buyWindow.buyWindowPlayer !== 0 || this.playerBuys[0] <= 0;

                // 🎯 v2.5.0: Check last card for all players (show alert only once per player)
                [0, 1, 2].forEach(p => {
                    if (this.playerHands[p].length === 1 && !this.lastCardAlertShown[p]) {
                        const playerName = p === 0 ? 'You' : p === 1 ? 'Habot' : 'Jabot';
                        showLastCardToast(playerName);
                        this.lastCardAlertShown[p] = true;  // Mark this player as alerted
                        console.log(`%c⚠️ Last card alert shown for ${playerName}`, 'color: #ff9800; font-weight: bold;');
                    }
                });
            }

            updateLeaderboard() {
                const container = document.getElementById('leaderboardEntries');
                if (!container) return;
                const names = ['You', 'Habot', 'Jabot'];
                const sorted = this.playerScores.map((score, idx) => ({ score, idx, name: names[idx] })).sort((a, b) => a.score - b.score);
                container.innerHTML = '';
                sorted.forEach((player, rank) => {
                    const entry = document.createElement('div');
                    entry.className = 'leaderboard-entry';
                    if (rank === 0) entry.classList.add('first');
                    if (rank === sorted.length - 1) entry.classList.add('last');
                    entry.innerHTML = `<div class="leaderboard-name">${rank === 0 ? '🏆 ' : ''}${player.name}${rank === sorted.length - 1 ? ' 🎃' : ''}</div><div class="leaderboard-score">${player.score} pts</div>`;
                    container.appendChild(entry);
                });
            }

            renderHand() {
                const container = document.getElementById('playerCards');
                container.innerHTML = '';
                this.playerHands[0].forEach((card, i) => {
                    const el = document.createElement('div');
                    el.className = `card ${card.getColor()}`;
                    if (card.suit === '♥') el.classList.add('heart');
                    if (card.suit === '♦') el.classList.add('diamond');
                    if (this.selectedCards.includes(i)) el.classList.add('selected');
                    el.innerHTML = `<div class="card-rank">${card.rank}</div><div class="card-suit">${card.suit}</div>`;
                    el.draggable = true;
                    el.dataset.index = i;
                    el.onclick = () => {
                        const idx = this.selectedCards.indexOf(i);
                        if (idx > -1) this.selectedCards.splice(idx, 1);
                        else this.selectedCards = [i];
                        this.updateUI();
                    };
                    el.addEventListener('dragstart', (e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', i); el.classList.add('dragging') });
                    el.addEventListener('dragend', (e) => { el.classList.remove('dragging'); document.querySelectorAll('.card').forEach(c => c.classList.remove('drag-over')) });
                    el.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' });
                    el.addEventListener('dragenter', (e) => { e.preventDefault(); if (el !== document.querySelector('.dragging')) el.classList.add('drag-over') });
                    el.addEventListener('dragleave', (e) => { el.classList.remove('drag-over') });
                    el.addEventListener('drop', (e) => {
                        e.preventDefault();
                        el.classList.remove('drag-over');
                        const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                        const toIdx = parseInt(el.dataset.index);
                        if (fromIdx !== toIdx) this.moveCard(fromIdx, toIdx);
                    });
                    container.appendChild(el);
                });
            }

            moveCard(fromIdx, toIdx) {
                const card = this.playerHands[0].splice(fromIdx, 1)[0];
                this.playerHands[0].splice(toIdx, 0, card);
                this.selectedCards = this.selectedCards.map(idx => {
                    if (idx === fromIdx) return toIdx;
                    if (fromIdx < toIdx) { if (idx > fromIdx && idx <= toIdx) return idx - 1 }
                    else { if (idx >= toIdx && idx < fromIdx) return idx + 1 }
                    return idx;
                });
                this.updateUI();
            }

            renderAIHands() {
                [1, 2].forEach(p => {
                    const container = document.getElementById(`player${p + 1}Cards`);
                    container.innerHTML = '';
                    const handSize = this.playerHands[p].length;
                    if (handSize > 6) {
                        container.innerHTML = `<div style="font-size: 2.2rem; font-weight: 900; color: var(--gold); text-align: center; padding: 25px; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${handSize} Cards</div>`;
                        return;
                    }
                    for (let i = 0; i < handSize; i++) {
                        const el = document.createElement('div');
                        el.className = 'card';
                        el.style.background = '#2c3e50';
                        el.style.cursor = 'default';
                        el.innerHTML = `<div style="font-size: 28px; color: rgba(255,255,255,0.4);">?</div>`;
                        container.appendChild(el);
                    }
                });
            }

            renderPublished() {
                [0, 1, 2].forEach(p => {
                    const containerId = p === 0 ? 'player1Cards' : `player${p + 1}CardsPublished`;
                    const container = document.getElementById(containerId);
                    container.innerHTML = '';
                    const uniqueCards = [];
                    const seenIds = new Set();
                    this.publishedSequences[p].forEach(card => { if (!seenIds.has(card.id)) { uniqueCards.push(card); seenIds.add(card.id) } });
                    uniqueCards.forEach(card => {
                        const el = document.createElement('div');
                        el.className = `card ${card.getColor()}`;
                        if (card.suit === '♥') el.classList.add('heart');
                        if (card.suit === '♦') el.classList.add('diamond');
                        el.style.transform = 'scale(0.7)';
                        el.innerHTML = `<div class="card-rank">${card.rank}</div><div class="card-suit">${card.suit}</div>`;
                        container.appendChild(el);
                    });
                });
            }
        }

        // Global functions
        function showPublishSelector(seqs, req) {
            const selector = document.getElementById('publishSelector');
            const options = document.getElementById('publishOptions');
            options.innerHTML = '';

            game.publishSelection = { triples: [], ladders: [] };

            const triplesNeeded = req.filter(s => s === 'triple').length;
            const laddersNeeded = req.filter(s => s === 'ladder').length;

            // ✅ FIX 5C: Map card IDs to consistent numbers ACROSS ALL SEQUENCES
            const duplicateCards = {};
            const cardIdToNumber = new Map();
            let nextNumber = 1;

            // First pass: Identify all duplicate rank+suit combinations
            game.playerHands[0].forEach(card => {
                const key = card.rank + card.suit;
                if (!duplicateCards[key]) duplicateCards[key] = [];
                duplicateCards[key].push(card);
            });

            // Assign consistent numbers to each UNIQUE CARD ID (only for duplicates)
            Object.entries(duplicateCards).forEach(([key, cards]) => {
                if (cards.length > 1) {
                    cards.forEach(card => {
                        cardIdToNumber.set(card.id, nextNumber++);
                    });
                }
            });

            console.log('%c✅ FIX 5C: Card ID mapping:', 'color:#4a90e2;font-weight:bold');
            cardIdToNumber.forEach((num, id) => {
                const card = game.playerHands[0].find(c => c.id === id);
                if (card) console.log(`  ${card.toString()} (id:${id.substr(0, 4)}) → Badge #${num}`);
            });

            if (triplesNeeded > 0) {
                const tripleDiv = document.createElement('div');
                tripleDiv.className = 'publish-option';
                tripleDiv.innerHTML = `<h4>Select ${triplesNeeded} Triple(s):</h4><div class="option-cards" id="tripleOptions"></div>`;
                options.appendChild(tripleDiv);

                const tripleContainer = document.getElementById('tripleOptions');

                seqs.triples.forEach((triple, idx) => {
                    const optDiv = document.createElement('div');
                    optDiv.style.cssText = 'display:flex;gap:5px;padding:8px;border:2px solid transparent;border-radius:8px;cursor:pointer;position:relative;';
                    optDiv.onclick = () => toggleTripleSelection(idx, optDiv);

                    triple.forEach(card => {
                        const cardEl = document.createElement('div');
                        cardEl.className = `card ${card.getColor()}`;
                        if (card.suit === '♥') cardEl.classList.add('heart');
                        if (card.suit === '♦') cardEl.classList.add('diamond');
                        cardEl.style.transform = 'scale(0.8)';
                        cardEl.style.position = 'relative';

                        // ✅ FIX 5C: Use CONSISTENT number based on card ID
                        let duplicateLabel = '';
                        if (cardIdToNumber.has(card.id)) {
                            const cardNumber = cardIdToNumber.get(card.id);
                            duplicateLabel = `<div style="position:absolute;top:2px;right:2px;background:#ffd700;color:#000;width:16px;height:16px;border-radius:50%;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1px solid #000;">${cardNumber}</div>`;
                        }

                        cardEl.innerHTML = `
                                        <div class="card-rank">${card.rank}</div>
                                        <div class="card-suit">${card.suit}</div>
                                        ${duplicateLabel}
                                    `;
                        optDiv.appendChild(cardEl);
                    });

                    tripleContainer.appendChild(optDiv);
                });
            }

            if (laddersNeeded > 0) {
                const ladderDiv = document.createElement('div');
                ladderDiv.className = 'publish-option';
                ladderDiv.innerHTML = `<h4>Select ${laddersNeeded} Ladder(s):</h4><div class="option-cards" id="ladderOptions"></div>`;
                options.appendChild(ladderDiv);

                const ladderContainer = document.getElementById('ladderOptions');

                seqs.ladders.forEach((ladder, idx) => {
                    const optDiv = document.createElement('div');
                    optDiv.style.cssText = 'display:flex;gap:5px;padding:8px;border:2px solid transparent;border-radius:8px;cursor:pointer;';
                    optDiv.onclick = () => toggleLadderSelection(idx, optDiv);

                    ladder.forEach(card => {
                        const cardEl = document.createElement('div');
                        cardEl.className = `card ${card.getColor()}`;
                        if (card.suit === '♥') cardEl.classList.add('heart');
                        if (card.suit === '♦') cardEl.classList.add('diamond');
                        cardEl.style.transform = 'scale(0.8)';
                        cardEl.style.position = 'relative';

                        // ✅ FIX 5C: Use CONSISTENT number based on card ID
                        let duplicateLabel = '';
                        if (cardIdToNumber.has(card.id)) {
                            const cardNumber = cardIdToNumber.get(card.id);
                            duplicateLabel = `<div style="position:absolute;top:2px;right:2px;background:#ffd700;color:#000;width:16px;height:16px;border-radius:50%;font-size:10px;font-weight:900;display:flex;align-items:center;justify-content:center;border:1px solid #000;">${cardNumber}</div>`;
                        }

                        cardEl.innerHTML = `
                                        <div class="card-rank">${card.rank}</div>
                                        <div class="card-suit">${card.suit}</div>
                                        ${duplicateLabel}
                                    `;
                        optDiv.appendChild(cardEl);
                    });

                    ladderContainer.appendChild(optDiv);
                });
            }

            selector.classList.add('active');
        }

        function toggleTripleSelection(idx, element) {
            const selected = game.publishSelection.triples;
            const pos = selected.indexOf(idx);
            if (pos > -1) { selected.splice(pos, 1); element.style.border = '2px solid transparent' }
            else { selected.push(idx); element.style.border = '2px solid #ffd700' }
        }

        function toggleLadderSelection(idx, element) {
            const selected = game.publishSelection.ladders;
            const pos = selected.indexOf(idx);
            if (pos > -1) { selected.splice(pos, 1); element.style.border = '2px solid transparent' }
            else { selected.push(idx); element.style.border = '2px solid #ffd700' }
        }

        function confirmManualPublish() {
            const req = game.handReqs[game.currentHand].seqs;
            const triplesNeeded = req.filter(s => s === 'triple').length;
            const laddersNeeded = req.filter(s => s === 'ladder').length;

            if (game.publishSelection.triples.length !== triplesNeeded ||
                game.publishSelection.ladders.length !== laddersNeeded) {
                game.showModal('Invalid Selection', `You must select exactly ${triplesNeeded} triple(s) and ${laddersNeeded} ladder(s)`);
                return;
            }

            const seqs = game.findSequences(game.playerHands[0]);
            let published = [];
            game.publishSelection.triples.forEach(idx => { published = published.concat(seqs.triples[idx]) });
            game.publishSelection.ladders.forEach(idx => { published = published.concat(seqs.ladders[idx]) });

            // ========== START FIX 5: REPLACE FROM HERE ==========

            // ✅ FIX 5: Check for duplicate card IDs (same physical card used twice)
            const usedCardIds = new Set();
            let hasDuplicateCard = false;
            let duplicateCard = null;

            for (let card of published) {
                if (usedCardIds.has(card.id)) {
                    hasDuplicateCard = true;
                    duplicateCard = card;
                    break;
                }
                usedCardIds.add(card.id);
            }

            if (hasDuplicateCard) {
                console.log('%c🚨 FIX 5: Duplicate card detected!', 'color:#ef4444;font-weight:bold');
                console.log(`  Card: ${duplicateCard.toString()} appears in multiple sequences`);
                game.showModal('Duplicate Card',
                    `You selected ${duplicateCard.toString()} in multiple sequences!\n\n` +
                    `Each card can only be used once.\n` +
                    `Please reselect your sequences.`);
                return;
            }

            // ✅ FIX 5: Also check rank+suit counts (belt-and-suspenders validation)
            const selectedCards = {};
            published.forEach(c => {
                const key = c.rank + c.suit;
                selectedCards[key] = (selectedCards[key] || 0) + 1;
            });

            const handCards = {};
            game.playerHands[0].forEach(c => {
                const key = c.rank + c.suit;
                handCards[key] = (handCards[key] || 0) + 1;
            });

            let hasOverlap = false;
            let overlapCard = '';
            for (let key in selectedCards) {
                if (selectedCards[key] > handCards[key]) {
                    hasOverlap = true;
                    overlapCard = key;
                    break;
                }
            }

            if (hasOverlap) {
                console.log('%c🚨 FIX 5: Card count overlap!', 'color:#ef4444;font-weight:bold');
                console.log(`  Card: ${overlapCard} - selected more than available`);
                game.showModal('Insufficient Cards',
                    `You selected more ${overlapCard} cards than you have!\n\n` +
                    `Please reselect your sequences.`);
                return;
            }

            console.log('%c✅ FIX 5: Validation passed - no duplicates', 'color:#28a745;font-weight:bold');

            // ========== END FIX 5: REPLACE TO HERE ==========

            // ✅ KEEP EVERYTHING BELOW (Execution section - unchanged)
            published.forEach(c => { const idx = game.playerHands[0].findIndex(card => card.id === c.id); if (idx > -1) game.playerHands[0].splice(idx, 1) });
            game.publishedSequences[0] = published;
            game.justPublished = true;
            cancelManualPublish();
            if (game.playerHands[0].length === 0) { game.endHand(0); return }
            game.updateUI();
        }

        function cancelManualPublish() { document.getElementById('publishSelector').classList.remove('active'); game.publishSelection = null }

        function addToPublished(playerIdx) {
            if (!game || game.currentPlayer !== 0 || game.gamePhase !== 'discard' || game.selectedCards.length !== 1) return;
            if (game.justPublished) { game.showModal('Cannot Add', 'Cannot add in same turn you published!'); return }
            if (game.publishedSequences[playerIdx].length === 0) {
                game.showModal('Cannot Add', `${playerIdx === 0 ? 'You have' : (playerIdx === 1 ? 'Habot has' : 'Jabot has')} not published yet!`);
                return;
            }

            const cardIdx = game.selectedCards[0];
            const card = game.playerHands[0][cardIdx];
            const req = game.handReqs[game.currentHand].seqs;
            const hasTriples = req.some(s => s === 'triple');
            const hasLadders = req.some(s => s === 'ladder');
            const published = game.publishedSequences[playerIdx];

            // ✅ FIX 6: Check if card could extend BOTH triple AND ladder (AMBIGUOUS!)
            const rankCounts = {};
            published.forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });

            const canExtendTriple = hasTriples && rankCounts[card.rank] >= 3;

            let canExtendLadder = false;
            if (hasLadders) {
                // ✅ FIX 6A: First separate triples from ladders to avoid confusion
                const allRankCounts = {};
                published.forEach(c => { allRankCounts[c.rank] = (allRankCounts[c.rank] || 0) + 1 });

                const tripleCards = [];
                const ladderCards = [];
                const processedRanks = new Set();

                published.forEach(c => {
                    if (allRankCounts[c.rank] >= 3 && !processedRanks.has(c.rank)) {
                        const sameRank = published.filter(card => card.rank === c.rank);
                        tripleCards.push(...sameRank);
                        processedRanks.add(c.rank);
                    }
                });

                published.forEach(c => {
                    if (!tripleCards.find(tc => tc.id === c.id)) ladderCards.push(c);
                });

                console.log(`%c🔍 FIX 6A: Separated - Triples: ${tripleCards.map(c => c.toString()).join(' ')}, Ladders: ${ladderCards.map(c => c.toString()).join(' ')}`, 'color:#4a90e2');

                // Now check if card can extend ONLY the ladder cards (not triples)
                const sameSuit = ladderCards.filter(c => c.suit === card.suit);
                if (sameSuit.length >= 4) {

                    const cardVal = card.getValue();
                    const values = sameSuit.map(c => c.getValue()).sort((a, b) => a - b);
                    const ladders = [];
                    let remainingValues = [...values];
                    const hasAce = values.includes(1);
                    const hasJack = values.includes(11);
                    const hasQueen = values.includes(12);
                    const hasKing = values.includes(13);
                    if (hasAce && hasJack && hasQueen && hasKing) {
                        ladders.push([1, 11, 12, 13]);
                        remainingValues = remainingValues.filter(v => ![1, 11, 12, 13].includes(v));
                    }
                    if (remainingValues.length >= 4) {
                        let currentLadder = [remainingValues[0]];
                        for (let i = 1; i < remainingValues.length; i++) {
                            if (remainingValues[i] === currentLadder[currentLadder.length - 1] + 1) {
                                currentLadder.push(remainingValues[i]);
                            } else {
                                if (currentLadder.length >= 4) { ladders.push([...currentLadder]) }
                                currentLadder = [remainingValues[i]];
                            }
                        }
                        if (currentLadder.length >= 4) { ladders.push(currentLadder) }
                    }
                    canExtendLadder = ladders.some(ladder => {
                        return game.canCardExtendLadder(cardVal, ladder);
                    });
                }
            }

            // ✅ FIX 6: AMBIGUOUS - card could go to EITHER sequence!
            if (canExtendTriple && canExtendLadder) {
                console.log(`%c🚨 FIX 6: AMBIGUOUS - ${card.toString()} could extend BOTH triple and ladder!`, 'color:#ff6b35;font-weight:bold');
                game.showDisambiguationModal(card, playerIdx, cardIdx);
                return;
            }

            // ✅ FIX 6: If NOT ambiguous, proceed with normal logic
            if (!canExtendTriple && !canExtendLadder) {
                let errorMsg = 'This card does not extend any sequence!\n\n';
                if (hasTriples && !hasLadders) errorMsg += 'This hand only allows TRIPLES.';
                else if (hasLadders && !hasTriples) errorMsg += 'This hand only allows LADDERS.';
                else errorMsg += 'For triples: Need 3+ same rank.\nFor ladders: Need 3+ consecutive same suit.';
                game.showModal('Invalid Card', errorMsg);
                return;
            }

            // Only one option available - use executeAddToPublished
            const forceType = canExtendTriple ? 'triple' : 'ladder';
            game.executeAddToPublished(card, playerIdx, cardIdx, forceType);
        }
        //Nash: newGame
        window.onload = () => newGame();

        // ============================================
        // 🎨 FIX 7B: Custom Confirmation Modal
        // ============================================
        function showConfirmModal(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
            return new Promise((resolve) => {
                const modal = document.getElementById('confirmModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalMessage = document.getElementById('modalMessage');
                const confirmBtn = document.getElementById('modalConfirm');
                const cancelBtn = document.getElementById('modalCancel');

                // Set content
                modalTitle.textContent = title;
                modalMessage.textContent = message;
                confirmBtn.textContent = confirmText;
                cancelBtn.textContent = cancelText;

                // Show modal
                modal.classList.add('active');

                // Handle confirm
                const handleConfirm = () => {
                    modal.classList.remove('active');
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                    resolve(true);
                };

                // Handle cancel
                const handleCancel = () => {
                    modal.classList.remove('active');
                    confirmBtn.removeEventListener('click', handleConfirm);
                    cancelBtn.removeEventListener('click', handleCancel);
                    resolve(false);
                };

                confirmBtn.addEventListener('click', handleConfirm);
                cancelBtn.addEventListener('click', handleCancel);

                // Close on overlay click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        handleCancel();
                    }
                });

                // Close on ESC key
                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        handleCancel();
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);
            });
        }

        // ============================================
        // 🎭 v2.5.0: CHARACTER BANTER SYSTEM
        // ============================================

        function getOpeningBanter() {
            const banterPool = [
                // Habot aggressive openers
                { speaker: 'Habot', text: "Let's see who fortune favors today!", personality: 'confident' },
                { speaker: 'Habot', text: "High card takes it - may the best player win!", personality: 'competitive' },
                { speaker: 'Habot', text: "Ready to see how luck plays out?", personality: 'eager' },
                { speaker: 'Habot', text: "Time to find out who leads the charge!", personality: 'bold' },

                // Jabot patient responses
                { speaker: 'Jabot', text: "Patience... the cards will tell the story.", personality: 'calm' },
                { speaker: 'Jabot', text: "Let's draw and see what fate decides.", personality: 'measured' },
                { speaker: 'Jabot', text: "The highest card speaks for itself.", personality: 'philosophical' },
                { speaker: 'Jabot', text: "A fair draw reveals the path forward.", personality: 'wise' }
            ];

            // Pick one from each personality
            const habotLine = banterPool.filter(b => b.speaker === 'Habot')[Math.floor(Math.random() * 4)];
            const jabotLine = banterPool.filter(b => b.speaker === 'Jabot')[Math.floor(Math.random() * 4)];

            return [habotLine, jabotLine];
        }

        function getWinReaction(winner, winnerCard, loserCards) {
            const reactions = {
                // Winner reactions
                winner: {
                    0: [  // Human wins
                        "Looks like fortune favors you today!",
                        "Well drawn! You'll lead us off.",
                        "A strong start - the table is yours!",
                        "Lady Luck smiles on you this hand."
                    ],
                    1: [  // Habot wins (confident/aggressive)
                        "Habot: Yes! The rabbit leads the race!",
                        "Habot: Perfect. Time to set the pace.",
                        "Habot: High card, high energy - let's go!",
                        "Habot: I'll show you how it's done."
                    ],
                    2: [  // Jabot wins (calm/strategic)
                        "Jabot: Interesting. I shall start with care.",
                        "Jabot: The cards have spoken. I begin.",
                        "Jabot: A thoughtful start, as it should be.",
                        "Jabot: Patience rewards... even in the draw."
                    ]
                },
                // Loser reactions
                graceful: [
                    "Well drawn!",
                    "Fair enough.",
                    "The cards decided.",
                    "So it goes."
                ],
                competitive: [
                    "Next time!",
                    "We'll see how this plays out.",
                    "The game hasn't started yet.",
                    "Just wait..."
                ]
            };

            const winnerReaction = reactions.winner[winner][Math.floor(Math.random() * 4)];

            // Loser reactions based on personality
            const loserReactions = [];
            if (winner !== 1) {  // Habot lost
                loserReactions.push({ speaker: 'Habot', text: reactions.competitive[Math.floor(Math.random() * 4)] });
            }
            if (winner !== 2) {  // Jabot lost
                loserReactions.push({ speaker: 'Jabot', text: reactions.graceful[Math.floor(Math.random() * 4)] });
            }

            return { winner: winnerReaction, losers: loserReactions };
        }

        function getSuitExplanation() {
            return {
                title: "♠♥♦♣ Suit Hierarchy",
                message: "In Bridge tradition:\n♠ Spades (highest)\n♥ Hearts\n♦ Diamonds  \n♣ Clubs (lowest)",
                tip: "Highest rank wins. If tied, highest suit breaks the tie."
            };
        }

        // ============================================
        // 🎨 FIX 7D: Info Modal with Auto-Fade
        // ============================================
        function showInfoModal(title, message, buttonText = 'Got it!', icon = '💬', autoFade = true, fadeDelay = 3000) {
            return new Promise((resolve) => {
                const modal = document.getElementById('confirmModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalMessage = document.getElementById('modalMessage');
                const modalIcon = document.querySelector('.modal-icon');
                const modalContent = document.querySelector('.modal-content');
                const confirmBtn = document.getElementById('modalConfirm');
                const cancelBtn = document.getElementById('modalCancel');

                modalIcon.textContent = icon;
                modalTitle.textContent = title;
                modalMessage.textContent = message;
                confirmBtn.textContent = buttonText;
                cancelBtn.style.display = 'none';

                let fadeIndicator = null;
                let skipHint = null;
                if (autoFade) {
                    fadeIndicator = document.createElement('div');
                    fadeIndicator.className = 'modal-auto-fade-indicator';
                    modalContent.appendChild(fadeIndicator);

                    skipHint = document.createElement('div');
                    skipHint.className = 'modal-skip-hint';
                    skipHint.textContent = 'Click or ESC to skip';
                    modalContent.appendChild(skipHint);
                }

                modal.classList.add('active');
                modal.classList.remove('fading-out');

                let fadeTimeout = null;
                let hasResolved = false;

                const handleClose = (wasAutomatic = false) => {
                    if (hasResolved) return;
                    hasResolved = true;

                    if (fadeTimeout) clearTimeout(fadeTimeout);

                    modal.classList.add('fading-out');

                    setTimeout(() => {
                        modal.classList.remove('active', 'fading-out');
                        cancelBtn.style.display = '';

                        if (fadeIndicator && fadeIndicator.parentNode) {
                            fadeIndicator.remove();
                        }
                        if (skipHint && skipHint.parentNode) {
                            skipHint.remove();
                        }

                        confirmBtn.removeEventListener('click', handleManualClose);
                        resolve(true);
                    }, 500);
                };

                const handleManualClose = () => handleClose(false);

                if (autoFade) {
                    fadeTimeout = setTimeout(() => {
                        handleClose(true);
                    }, fadeDelay);
                }

                confirmBtn.addEventListener('click', handleManualClose);

                const handleOverlayClick = (e) => {
                    if (e.target === modal) handleManualClose();
                };
                modal.addEventListener('click', handleOverlayClick);

                const handleEscape = (e) => {
                    if (e.key === 'Escape') {
                        handleManualClose();
                        document.removeEventListener('keydown', handleEscape);
                    }
                };
                document.addEventListener('keydown', handleEscape);

                setTimeout(() => {
                    modal.removeEventListener('click', handleOverlayClick);
                    document.removeEventListener('keydown', handleEscape);
                }, fadeDelay + 1000);
            });
        }

        async function newGame() {
            // ✅ FIX 7B: Custom confirmation modal (no "This page says"!)
            if (game && game.gamePhase !== 'end') {
                const confirmed = await showConfirmModal(
                    'Start New Game?',
                    'This will end the current game and reset all scores.\n\nAre you sure you want to continue?',
                    'Start New Game',
                    'Continue Playing'
                );

                if (!confirmed) {
                    return; // User cancelled
                }
            }
            persistentScores = [0, 0, 0];
            game = new GameState(false);
        }

        function drawFromDeck() {
            if (!game || game.currentPlayer !== 0 || game.gamePhase !== 'draw') return;
            if (game.buyWindow.active) game.closeBuyWindow('player-turn');
            if (game.deck.length === 0) { if (!game.reshuffleDeck()) { alert('Deck is empty!'); return } game.updateUI() }
            if (game.deck.length > 0) {
                const drawnCard = game.deck.pop();
                game.playerHands[0].push(drawnCard);
                game.gamePhase = 'discard';
                game.turnCounter++;
                game.updateUI();
            }
        }

        function drawFromDiscard() {
            if (!game || game.currentPlayer !== 0 || game.gamePhase !== 'draw') return;

            // 🎨 v2.5: Show modal if discard pile is empty
            if (game.discardPile.length === 0) {
                showInfoModal(
                    'Discard Pile Empty',
                    'The last card was taken by another player. Please draw from the deck instead.',
                    'Okay',
                    '🎴',
                    true,    // auto-fade
                    2000     // 2 seconds
                );
                return;
            }

            const card = game.discardPile.pop();
            game.playerHands[0].push(card);
            if (game.buyWindow.active) game.closeBuyWindow('player-took');
            if (game.lastDiscard && game.lastDiscard.rank === card.rank && game.lastDiscard.suit === card.suit) {
                game.lastDiscard = null;
                game.lastDiscardByPlayer = -1;
            }
            game.gamePhase = 'discard';
            game.turnCounter++;
            game.updateUI();
        }

        function discardCard() {
            if (!game || game.currentPlayer !== 0 || game.gamePhase !== 'discard' || game.selectedCards.length !== 1) return;
            const card = game.playerHands[0].splice(game.selectedCards[0], 1)[0];
            game.discardPile.push(card);
            game.selectedCards = [];
            game.lastDiscard = card;
            game.lastDiscardByPlayer = 0;
            game.justPublished = false;
            if (game.playerHands[0].length === 0) { game.updateUI(); setTimeout(() => { game.endHand(0) }, 500); return }
            game.currentPlayer = 1;
            game.gamePhase = 'draw';
            game.updateUI();
            if (game.currentPlayer !== 0) game.aiTurn();
        }

        function publishSequences() {
            if (!game || game.currentPlayer !== 0 || game.gamePhase !== 'discard') return;
            if (!game.canPublish(0)) { game.showModal('Cannot Publish', 'You do not have the required sequences!'); return }
            const seqs = game.findSequences(game.playerHands[0]);
            const req = game.handReqs[game.currentHand].seqs;
            let needsManualSelection = false;
            const triplesNeeded = req.filter(s => s === 'triple').length;
            const laddersNeeded = req.filter(s => s === 'ladder').length;
            if (seqs.triples.length > triplesNeeded || seqs.ladders.length > laddersNeeded) needsManualSelection = true;
            const rankCounts = {};
            game.playerHands[0].forEach(c => { rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1 });
            Object.values(rankCounts).forEach(count => { if (count >= 4) needsManualSelection = true });
            if (needsManualSelection) showPublishSelector(seqs, req);
            else {
                game.autoPublish(0);
                game.justPublished = true;
                if (game.playerHands[0].length === 0) { game.endHand(0); return }
                game.updateUI();
            }
        }

        function buyCard() {
            if (!game || game.playerBuys[0] <= 0) return;
            if (!game.buyWindow.active || !game.buyWindow.card) return;
            if (game.buyWindow.buyWindowPlayer !== 0) return;
            const card = game.buyWindow.card;
            const idx = game.discardPile.findIndex(c => c.id === card.id);
            if (idx === -1) { game.closeBuyWindow('taken'); showToast('Card no longer available', 'warning', 2000); return }
            game.discardPile.splice(idx, 1);
            game.playerHands[0].push(card);
            if (game.lastDiscard && game.lastDiscard.rank === card.rank && game.lastDiscard.suit === card.suit) {
                game.lastDiscard = null;
                game.lastDiscardByPlayer = -1;
            }
            if (game.deck.length === 0) { game.reshuffleDeck(); game.updateUI() }
            if (game.deck.length > 0) {
                const penalty = game.deck.pop();
                game.playerHands[0].push(penalty);
            }
            game.playerBuys[0]--;
            showToast(`You bought ${card.toString()}!`, 'buy', 2500);
            game.updateUI();
            game.closeBuyWindow('bought');
        }




        function sortByRank() {
            if (!game) return;
            game.playerHands[0].sort((a, b) => {
                if (a.getValue() !== b.getValue()) return a.getValue() - b.getValue();
                return a.suit.localeCompare(b.suit);
            });
            game.selectedCards = [];
            game.updateUI();
        }

        function sortBySuit() {
            if (!game) return;
            const order = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
            game.playerHands[0].sort((a, b) => {
                if (order[a.suit] !== order[b.suit]) return order[a.suit] - order[b.suit];
                return a.getValue() - b.getValue();
            });
            game.selectedCards = [];
            game.updateUI();
        }

        function sortByQuantity() {
            if (!game) return;
            const counts = {};
            game.playerHands[0].forEach(card => { counts[card.rank] = (counts[card.rank] || 0) + 1 });
            game.playerHands[0].sort((a, b) => {
                const countDiff = counts[b.rank] - counts[a.rank];
                if (countDiff !== 0) return countDiff;
                if (a.getValue() !== b.getValue()) return a.getValue() - b.getValue();
                return a.suit.localeCompare(b.suit);
            });
            game.selectedCards = [];
            game.updateUI();
        }

        // Toast Notification System
        function showToast(message, type = 'info', duration = 2500) {
            const container = document.querySelector('.toast-container') || createToastContainer();
            const toast = document.createElement('div');
            let bgColor, textColor, icon;
            switch (type) {
                case 'buy': bgColor = 'linear-gradient(135deg, #ffc107, #ff9800)'; textColor = '#000'; icon = '💰'; break;
                case 'warning': bgColor = 'linear-gradient(135deg, #ff6b35, #f7931e)'; textColor = '#fff'; icon = '⚠️'; break;
                case 'win': bgColor = 'linear-gradient(135deg, #ffd700, #ffed4e)'; textColor = '#000'; icon = '🏆'; duration = 3000; break;
                default: bgColor = 'linear-gradient(135deg, #4ade80, #22c55e)'; textColor = '#000'; icon = 'ℹ️';
            }
            toast.style.cssText = `background: ${bgColor}; color: ${textColor}; padding: 16px 24px; border-radius: 12px; font-weight: 900; font-size: 1.1rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); animation: slideIn 0.3s ease; pointer-events: auto; ${type === 'win' ? 'animation: slideIn 0.3s ease, victoryPulse 0.5s ease 0.3s 3;' : ''}`;
            toast.innerHTML = `${icon} ${message}`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => { toast.remove(); if (container.children.length === 0) container.remove() }, 300);
            }, duration);
        }

        function createToastContainer() {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
            return container;
        }

        function showBuyToast(aiName, card) { showToast(`${aiName} BOUGHT ${card.toString()}!`, 'buy') }

        // ============================================
        // 🎨 v2.5: Modal Notifications (Auto-Fade)
        // ============================================
        function showAITookCardToast(aiName, card) {
            console.log(`%c🚨 FIX 2: Showing AI took card modal (auto-fade)`, 'color: #ff6b35; font-weight: bold;');
            // Auto-fades after 2.5 seconds - quick notification
            showInfoModal(
                `${aiName} Bought Card`,
                `${aiName} took the ${card.toString()} from the discard pile.`,
                'Continue',
                '💰',
                true,    // auto-fade enabled
                2500     // 2.5 seconds
            );
        }

        function showLastCardToast(playerName) {
            const verb = playerName === 'You' ? 'have' : 'has';
            // NO auto-fade - critical warning!
            showInfoModal(
                '⚠️ Last Card Alert!',
                `${playerName} ${verb} only 1 card remaining!`,
                'Got it!',
                '🃏',
                false    // NO auto-fade - player must acknowledge
            );
        }

        function showWinToast(playerName) {
            const verb = (playerName === 'You') ? 'Win' : 'Wins';
            // NO auto-fade - game over message!
            showInfoModal(
                '🏆 Game Over!',
                `${playerName} ${verb}!`,
                'New Game',
                '🎉',
                false    // NO auto-fade - player must acknowledge
            );
        }


