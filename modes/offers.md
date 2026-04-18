# Mode: offers - Multi-Offer Comparison

Use this weighted matrix:

| Dimension | Weight | 5 means... | 1 means... |
|----------|--------|------------|------------|
| North Star alignment | 25% | Exact target role | Unrelated role |
| CV match | 15% | 90%+ match | <40% match |
| Level fit | 15% | Strong level trajectory | Mis-leveled |
| Estimated compensation | 10% | Top quartile | Below market |
| Growth trajectory | 10% | Clear advancement path | Dead end |
| Remote quality | 5% | Full async remote | Onsite only |
| Company reputation | 5% | Strong positive signal | Red flags |
| Stack modernity | 5% | Modern production stack | Legacy only |
| Time to offer | 5% | Fast process | Very slow process |
| Culture signal | 5% | Builder culture | Bureaucratic |

For each offer:
1. Score each dimension.
2. Compute weighted total.
3. Rank offers and provide recommendation with trade-offs.

If offers are missing from context, ask user to provide text, URLs, or tracker references.
