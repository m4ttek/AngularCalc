using Microsoft.Owin;
using Owin;

[assembly: OwinStartupAttribute(typeof(AngularCalc.Startup))]
namespace AngularCalc
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
        }
    }
}
