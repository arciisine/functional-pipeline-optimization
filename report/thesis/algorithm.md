**How the algorithm works**
In general, the algorithm attempts to mimic the assumptions and behavior of programmers when converting
functional list operations (`map`, `reduce`, `filter`, `find`, `some`, etc.) into `for-loop` semantics.

When dealing with the common cases and patterns, the algorithm is simple.  The real complexity arises
in ensure all places where this could be used do not violate correctness.  There is still the real
issue of write-dependence between operations as each iteration runs through all operations instead of
running an operation through all elements at once.

Also, with respect to closed variables, the assumption is made that certain member expressions (`a.b.c`) are 
global and therefore not counted as preclusions for inlining.  With respect to total correctness, this assumption
is wrong, as every function, variable etc. can be re-written, redefined, and shadowed in javacript.  If
someone has a local variable called `String` we will fail.  The odds of this are fairly low, but
are still a reality, especially for included predicates/transformations from other sources.  We take a
minimalist approach to only assume global access on the most commonly used expressions 
(e.g. `String.fromCharCode` vs just `String`)

**Different Types of Functions**
* Invalid
  * Any operation that relies upon knowledge of the intermediate arrays or array size will invalidate 
    optimization and drops to the basic form.  This is due to the fact that most operations discard the
    intermediate arrays and we gain performance by not creating the array.  
* Inline
  * Closed variables are in scope of the chain expression
  * Cannot change at runtime  
* Static reference
  * Defined by the fact that the variable is not a parameter in any enclosing function scopes.  
    * This assumption may not be entirely valid as external variables 
      could change, but should generally maintain the same form
    * Will add an optimize flag to override this assumption when needed 
  * Closed variables are not reachable
    * Will not know until runtime
    * Devolves to dynamic reference
  * Form without closures can be optimized
    * Can act the same as Inline form
* Dynamic reference
  * Cannot be guaranteed (with a high level of certainty) that the function is the same as previous invocations
    * Function references that are passed in ( assuming predicate or transformation is an input )
    * Functions that are computed
      * e.g. `const adder = y => (x => x + y)` 
      * Could result in a dynamic function every time
      * Usually will have some sort of closure that we cannot recover from
      * Will default to invocation form 
  * Can only result in invocation form
    * Will invoke the function passed in with the appropriate parameters
    * Sub-optimal, but still avoids penalty of creating the intermediate arrays
    * Since the generated theh code will be the same for every 

**Tagging Functions**
One of the key pieces needed for performance is uniquely identifying each callsite, and
precomputing as much as possible for each unique operation.  Because the keys require
some certain level of inforamtion, computing them at runtime can be costly.  

* Static/Inline 
  * These functions can have their key computed at compile time since they are static
  * For a functional list expression, we can coalesce all neighboring static keys
    to minimize computation
  * IF all keys are static for a functional list expression, we can reduce it to a single
    unique key of minimal size
  * If a static form (not a function parameter) is found to have closed variables at runtime
    we need to compute it's key. 
    * This is the worst case scenario as it requires additional computation for the key which
      is overhead for every execution.  If the number of iterations doesn't overcome the cost
      of key computation, we are losing.
* Dynamic 
  * If dynamic is known at compile-time (and using invocation form) we can also precompute
    a unique key since it should always produce the same form.