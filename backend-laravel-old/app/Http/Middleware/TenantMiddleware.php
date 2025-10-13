<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Tenancy;
use Stancl\Tenancy\Resolvers\DomainTenantResolver;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    protected $tenancy;
    protected $resolver;

    public function __construct(Tenancy $tenancy, DomainTenantResolver $resolver)
    {
        $this->tenancy = $tenancy;
        $this->resolver = $resolver;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Resolve tenant from domain/subdomain
        $tenant = $this->resolver->resolve($request);

        if ($tenant) {
            // Initialize tenant context
            $this->tenancy->initialize($tenant);

            // Check if tenant is active
            if (!$tenant->isActive()) {
                return response()->json([
                    'message' => 'Tenant is suspended or inactive.'
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Handle tasks after the response has been sent to the browser.
     */
    public function terminate(Request $request, Response $response): void
    {
        $this->tenancy->end();
    }
}

