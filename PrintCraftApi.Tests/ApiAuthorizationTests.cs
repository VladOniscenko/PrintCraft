using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using PrintCraftApi.Controllers;
using Xunit;

namespace PrintCraftApi.Tests;

public class ApiAuthorizationTests
{
    private static readonly HashSet<string> ApprovedPublicMutatingActions = new(StringComparer.OrdinalIgnoreCase)
    {
        "AuthController.Register",
        "AuthController.Login",
        "AuthController.ForgotPassword",
        "AuthController.ResetPassword",
        "OrdersController.CreateQuote",
        "QuoteDraftsController.Create",
        "AnalyticsController.TrackVisit",
        "UploadController.Upload",
        "UploadController.DeleteTempUpload",
        "FilamentPaintingController.GeneratePainting"
    };

    private static IEnumerable<Type> GetControllerTypes()
    {
        return typeof(AdminController).Assembly
            .GetTypes()
            .Where(t => typeof(ControllerBase).IsAssignableFrom(t) && !t.IsAbstract);
    }

    private static IEnumerable<(Type Controller, MethodInfo Method, HttpMethodAttribute HttpAttr)> GetActionMethods()
    {
        foreach (var controller in GetControllerTypes())
        {
            var methods = controller.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);
            foreach (var method in methods)
            {
                var httpAttr = method.GetCustomAttribute<HttpMethodAttribute>();
                if (httpAttr != null)
                {
                    yield return (controller, method, httpAttr);
                }
            }
        }
    }

    [Fact]
    public void AdminController_HasAdminOnlyAuthorization()
    {
        var authAttr = typeof(AdminController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
        Assert.Equal("admin", authAttr.Roles);
    }

    [Fact]
    public void EmailTemplatesController_HasAdminOnlyAuthorization()
    {
        var authAttr = typeof(EmailTemplatesController).GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authAttr);
        Assert.Equal("admin", authAttr.Roles);
    }

    [Theory]
    [InlineData(typeof(CitiesController))]
    [InlineData(typeof(FaqController))]
    [InlineData(typeof(FaqTopicsController))]
    [InlineData(typeof(HeroSlidesController))]
    [InlineData(typeof(FilamentsController))]
    public void SystemResourceControllers_MutatingEndpoints_RequireAdminRole(Type controllerType)
    {
        var mutatingHttpMethods = new[] { "POST", "PUT", "PATCH", "DELETE" };
        var methods = controllerType.GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly);

        foreach (var method in methods)
        {
            var httpAttr = method.GetCustomAttribute<HttpMethodAttribute>();
            if (httpAttr == null) continue;

            bool isMutating = httpAttr.HttpMethods.Any(m => mutatingHttpMethods.Contains(m.ToUpperInvariant()));
            if (isMutating)
            {
                var authAttr = method.GetCustomAttribute<AuthorizeAttribute>()
                    ?? controllerType.GetCustomAttribute<AuthorizeAttribute>();

                Assert.True(
                    authAttr != null && string.Equals(authAttr.Roles, "admin", StringComparison.OrdinalIgnoreCase),
                    $"Endpoint '{controllerType.Name}.{method.Name}' must have [Authorize(Roles = \"admin\")].");

                var allowAnon = method.GetCustomAttribute<AllowAnonymousAttribute>();
                Assert.Null(allowAnon);
            }
        }
    }

    [Fact]
    public void HeroSlidesController_UploadAndFiles_RequireAdminRole()
    {
        var uploadMethod = typeof(HeroSlidesController).GetMethod("Upload");
        Assert.NotNull(uploadMethod);
        var uploadAuth = uploadMethod.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(uploadAuth);
        Assert.Equal("admin", uploadAuth.Roles);

        var filesMethod = typeof(HeroSlidesController).GetMethod("GetAvailableFiles");
        Assert.NotNull(filesMethod);
        var filesAuth = filesMethod.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(filesAuth);
        Assert.Equal("admin", filesAuth.Roles);
    }

    [Fact]
    public void AllMutatingEndpoints_MustBeProtected_OrExplicitlyWhitelisted()
    {
        var mutatingHttpMethods = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "POST", "PUT", "PATCH", "DELETE" };
        var unapprovedPublicMutatingEndpoints = new List<string>();

        foreach (var (controller, method, httpAttr) in GetActionMethods())
        {
            bool isMutating = httpAttr.HttpMethods.Any(m => mutatingHttpMethods.Contains(m));
            if (!isMutating) continue;

            var actionIdentifier = $"{controller.Name}.{method.Name}";
            bool isExplicitlyWhitelisted = ApprovedPublicMutatingActions.Contains(actionIdentifier);

            var methodAllowAnonymous = method.GetCustomAttribute<AllowAnonymousAttribute>() != null;
            var controllerAuthorize = controller.GetCustomAttribute<AuthorizeAttribute>();
            var methodAuthorize = method.GetCustomAttribute<AuthorizeAttribute>();

            var effectiveAuthorize = methodAuthorize ?? controllerAuthorize;
            bool isEffectivelyAnonymous = methodAllowAnonymous || effectiveAuthorize == null;

            if (isEffectivelyAnonymous && !isExplicitlyWhitelisted)
            {
                unapprovedPublicMutatingEndpoints.Add($"{actionIdentifier} [{string.Join(",", httpAttr.HttpMethods)}]");
            }
        }

        Assert.True(
            unapprovedPublicMutatingEndpoints.Count == 0,
            $"Found {unapprovedPublicMutatingEndpoints.Count} unapproved public mutating endpoints:\n" +
            string.Join("\n", unapprovedPublicMutatingEndpoints));
    }

    [Fact]
    public void WhitelistedPublicMutatingEndpoints_AreStrictlyLimited()
    {
        // Enforce that only the intended 10 endpoints are whitelisted
        Assert.Equal(10, ApprovedPublicMutatingActions.Count);
    }
}

